import { randomBytes } from 'crypto';
import { BloomFilter } from 'bloomfilter';
import hex2Bin from 'hex-to-bin';
import * as fs from 'fs';
 
function generateRandom256BitString(): string { 
     const bytes = randomBytes(32);
     return Array.from(bytes)
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join('');
 }

// important: numbers are to big and therefore we have not precise results. Use hex2Bin instead
 export function convertSetToBinary(set: Set<string>): Set<string> {
     const resultSet = new Set<string>()
     set.forEach(id => {
      resultSet.add(hex2Bin(id))
  });
    return resultSet
 }

 export function drawNFromSet(validIds:Set<string>,revokedIds:Set<string>,neededIteration:number, addToValidIds: boolean){
   for (let i = 0; i < neededIteration;) {
       const randomId = generateRandom256BitString()
       if(!validIds.has(randomId) && !revokedIds.has(randomId)){
         if(addToValidIds){
            validIds.add(randomId)
         }else {
            revokedIds.add(randomId)
         }
          i++;
       }
    }
 }
export function constructBFC(validIds: Set<string>, revokedIds: Set<string>, rHat: number): [BloomFilter[], string] {
    if(validIds?.size > rHat || revokedIds?.size > 2*rHat){
      console.log("Error: Requirements not fulfilled. Returning empty array")
      return [[], "0"]
    }
    const sHat = 2*rHat
    const neededR = rHat - validIds?.size
    const neededS = sHat - revokedIds?.size
    
    validIds = convertSetToBinary(validIds)
    revokedIds = convertSetToBinary(revokedIds)

    
    drawNFromSet(validIds,revokedIds,neededR, true)
    drawNFromSet(validIds,revokedIds,neededS, false)

   const salted = generateRandom256BitString()

   const pb = 0.5
   const pa = Math.sqrt(0.5) / 2

   let includedSet = validIds
   let excludedSet = revokedIds
   let filter: BloomFilter[] = []
   let cascadeLevel = 1;
   while (includedSet.size > 0){
     const sizeInBit= (-1.0*includedSet.size*Math.log(cascadeLevel===1?pa:pb))/(Math.log(2)*Math.log(2))
     console.log(sizeInBit)
     const currentFilter = new BloomFilter(sizeInBit, 1);
      includedSet.forEach(id=>{
        currentFilter.add(id + cascadeLevel.toString(2).padStart(8, "0") + salted) //we interprete cascadeLevel as 8bit
      });
      filter.push(currentFilter)

      let falsePositives = new Set<string>()
      excludedSet.forEach(id => {
         if(currentFilter.test(id + cascadeLevel.toString(2).padStart(8, "0") + salted)){
                    falsePositives.add(id)
                }
     });
      console.log("false positive", falsePositives.size)
      excludedSet = includedSet
      includedSet = falsePositives
      cascadeLevel++;
   }
     console.log([filter,salted])
   return [
     filter, salted
   ]
}

export function isInBFC(value:string, bfc:BloomFilter[]): boolean {
  for(const bloomFilter of bfc){
     if(bloomFilter.test(value)){
          return true;
     }
  }
  return false;
}

// export function serializeBloomFilterCascade(bfc:[BloomFilter[], string]): string {
//    console.log("serializing")
//    bfc[0].forEach(filter => {
//       // Transform bloomFilterCascade to JSON format 
//       filter.toJSON = function() {
      
//     // Convert each element of _filter.array to an 8-bit binary string
//     const binaryContent = Object.values(filter._filter.array as number[]).map((byte: number) => byte.toString(2).padStart(8, '0'));

//     // The JSON for each filter should contain only the size and the bits in the filter
//           return {
//               filter: {
//                size: this._filter.size,
//                content: binaryContent
//               }
//           };
//       };
//   });

//    // The serialized object at the end should contain the size of BloomFilterCascade, the salt, and every bloomFilter
//    // JSON is a better approach then byte[] because we dont need to use length encoding
//    const serializedArray = JSON.stringify({sizeBloomFilterCascade: bfc[0].length, salt: bfc[1], bloomFilters: bfc[0]});  
//  return serializedArray 
// }

function binaryStringToBuffer(binaryString: string): Buffer {
   const byteArray = [];

   // Add padding to binary string if necessary
   const paddedBinaryString = binaryString.padStart(Math.ceil(binaryString.length / 8) * 8, '0');

   // Convert every 8 bits into a byte (number)
   for (let i = 0; i < paddedBinaryString.length; i += 8) {
       const byte = paddedBinaryString.slice(i, i + 8);
       byteArray.push(parseInt(byte, 2)); 
   }

   return Buffer.from(byteArray); 
}

export function toDataHexString(bfc:[BloomFilter[], string]): string {
  const serializedCascade = bfc[0].map(filter => {
   // Serialization from npm documentation
   var array = [].slice.call(filter.buckets)
   
   // Create and fill the buffer with the filter content
   const currentFilterBuffer = Buffer.from(filter.buckets.buffer);
   
   // Allocate 4 Bytes for lengthPrefix. The more items we have, the bigger the length would be
   const lengthPrefix = Buffer.alloc(4);  
   lengthPrefix.writeUInt32BE(currentFilterBuffer.length, 0);  // Store the length in the Buffer using big endian
   // For each filter concatinate the filter itself with its length
   return Buffer.concat([lengthPrefix, currentFilterBuffer]); 
  });

  // Create a Buffer to store the salt
  const serializedSalt =  binaryStringToBuffer(bfc[1])
  // Create a Buffer from the array of Buffers
  const serializedCascadeBuffer = Buffer.concat(serializedCascade);
  // Concatinate the salt and the buffer of filterCascade
  const serializedArray =  Buffer.concat([serializedSalt, serializedCascadeBuffer]);
  // Return a string hex value
 return `0x${serializedArray.toString('hex')}`
}

// export function deserializeBloomFilterCascade(serialized: string): [BloomFilter[], string] {
//    // Transform JSON to object
//    const parsedData = JSON.parse(serialized);
   
//    // Transform each value of the bloom filter to decimal (see serialization method for more info)
//    const bloomFilters = parsedData.bloomFilters.map((filterData: any) => {
//      const byteArray = filterData.filter.content.map((binaryString: string) => parseInt(binaryString, 2));
 
//      // Create a new filter with the decimal data 
//      const filter = new BloomFilter(filterData.filter.size); 
//      filter._filter.array = byteArray; 
 
//      return filter;
//    });
//    return [bloomFilters, parsedData.salt];
//  }

 export function fromDataHexString(serialized: string): [BloomFilter[], string] {
   // Create a buffer from the string hex value by first removing 0x
   const buffer = Buffer.from(serialized.slice(2), 'hex');
  
  // Extract the salt - the first 32 bytes
  const saltBuffer = buffer.subarray(0, 32);
  const salt = Array.from(saltBuffer).map(byte => byte.toString(2).padStart(8, '0')).join('')
  
  const bloomFilters: BloomFilter[] = [];

  let startIndex = 32
  while (startIndex < buffer.length) {
    // Read the length which takes 4 bytes
    const lengthPrefix = buffer.readUInt32BE(startIndex);
    startIndex += 4;

    // Read the Bloom filter content 
    const filterContent = buffer.subarray(startIndex, startIndex + lengthPrefix);
    startIndex += lengthPrefix;

    
    // Create a new bloom filter of size in bits and number of hash functions and store the filter content
    const currentFilter = new BloomFilter(filterContent.length * 8, 1)
    // Buckets is of type Int32Array, so we have to convert the buffer back to Int32Array
    currentFilter.buckets =new Int32Array(filterContent.buffer,  filterContent.byteOffset, filterContent.byteLength / Int32Array.BYTES_PER_ELEMENT)

    bloomFilters.push(currentFilter);
  }
  return [bloomFilters, salt];
 }
 
 let validTestSet = new Set<string>();
    for (let i = 1; i <= 100000; i++) {
       let randomHex = '';
       const hexLength = 64;
           
           // Generate a 64-character (32-byte) hex value
           for (let i = 0; i < hexLength / 8; i++) {
               // Generate a random 8-character hex segment
               const segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
               randomHex += segment;
           }
       validTestSet.add(randomHex); // Convert each number to a string and add it to the Set
    }
    let invalidTestSet = new Set<string>();
    for (let i = 100000; i <= 300000; i++) {
       const hexLength = 64; // Desired length of each hex value
    
           let randomHex = '';
           
           // Generate a 64-character (32-byte) hex value
           for (let i = 0; i < hexLength / 8; i++) {
               // Generate a random 8-character hex segment
               const segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
               randomHex += segment;
           }
       invalidTestSet.add(randomHex); // Convert each number to a string and add it to the Set
    }
    const result = constructBFC(validTestSet, invalidTestSet, 100001)
    //fromDataHexString(toDataHexString(result))
    fs.writeFileSync('output.txt', toDataHexString(result), 'utf8');


   