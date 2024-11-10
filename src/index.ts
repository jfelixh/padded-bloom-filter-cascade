import { randomBytes } from 'crypto';
const {BloomFilter} = require('bloom-filters')
import hex2Bin from 'hex-to-bin';


// type BloomFilterCascade = BloomFilter[];
 
function generateRandom256BitString(): string { 
     const bytes = randomBytes(32);
     return Array.from(bytes)
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join('');
 }

 // // imporant: numbers are to big and therefore we have not precise results if using this function. Use hex2Bin instead
//  function convertHexToBinary(hex: string): string {
//     return (parseInt(hex, 16).toString(2)).padStart(8, '0') 
//  }

 function convertSetToBinary(set: Set<string>): Set<string> {
     const resultSet = new Set<string>()
     set.forEach(id => {
      resultSet.add(hex2Bin(id))
  });
    //for(let i=0;i<set.size;i++){// NOT WORKING
    //    resultSet.add(convertHexToBinary(""))//TODO
    //}
    return resultSet
 }

 function drawNFromSet(validIds:Set<string>,revokedIds:Set<string>,neededIteration:number, addToValidIds: boolean){
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
export function constructBFC(this: typeof BloomFilter, validIds: Set<string>, revokedIds: Set<string>, rHat: number): [typeof BloomFilter[], string] {
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
   let filter = []
   let cascadeLevel = 1;
   //Why is this falsepositive_last needed?
   let falsepostive_last=0;
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
         if(currentFilter.has(id + cascadeLevel.toString(2).padStart(8, "0") + salted)){
                    falsePositives.add(id)
                }
     });
      console.log("false positive", falsePositives.size)
      excludedSet = includedSet
      includedSet = falsePositives
      cascadeLevel++;
      falsepostive_last=falsePositives.size
   }
     console.log([filter,salted])
   return [
     filter, salted
   ]
}

const validTestSet = new Set<string>();
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
const invalidTestSet = new Set<string>();
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
//console.log(result)

export function isInBFC(value:string, bfc:typeof BloomFilter[]): boolean {
  for(const bloomFilter of bfc){
     if(bloomFilter.has(value)){
          return true;
     }
  }
  return false;
}

export function serializeBloomFilterCascade(bfc:[typeof BloomFilter[], string]): string {
   bfc[0].forEach(filter => {
      // Transform bloomFilterCascade to JSON format 
      filter.toJSON = function() {
      
    // Convert each element of _filter.array to an 8-bit binary string
    const binaryContent = Object.values(filter._filter.array as number[]).map((byte: number) => byte.toString(2).padStart(8, '0'));

    // The JSON for each filter should contain only the size and the bits in the filter
          return {
              filter: {
               size: this._filter.size,
               content: binaryContent
              }
          };
      };
  });

   // The serialized object at the end should contain the size of BloomFilterCascade, the salt, and every bloomFilter
   // JSON is a better approach then byte[] because we dont need to use length encoding
   const serializedArray = JSON.stringify({sizeBloomFilterCascade: bfc[0].length, salt: bfc[1], bloomFilters: bfc[0]});  
 return serializedArray 
}

export function deserializeBloomFilterCascade(serialized: string): [typeof BloomFilter[], string] {
   // Transform JSON to object
   const parsedData = JSON.parse(serialized);
   
   // Transform each value of the bloom filter to decimal (see serialization method for more info)
   const bloomFilters = parsedData.bloomFilters.map((filterData: any) => {
     const byteArray = filterData.filter.content.map((binaryString: string) => parseInt(binaryString, 2));
 
     // Create a new filter with the decimal data 
     const filter = new BloomFilter(filterData.filter.size); 
     filter._filter.array = byteArray; 
 
     return filter;
   });
   return [bloomFilters, parsedData.salt];
 }