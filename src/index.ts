import { randomBytes } from 'crypto';
import { BloomFilter } from 'bloomfilter';
import hex2Bin from 'hex-to-bin';
import { symlink } from 'fs';
type BloomFilterCascade = BloomFilter[];

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
export function constructBFC(this: any, validIds: Set<string>, revokedIds: Set<string>, rHat: number): [BloomFilterCascade, string] {
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
   let filter: BloomFilterCascade = []
   let cascadeLevel = 1;

   while (includedSet.size > 0){
     const sizeInBit= (-1.0*includedSet.size*Math.log(cascadeLevel===1?pa:pb))/(Math.log(2)*Math.log(2))
     const currentFilter = new BloomFilter(sizeInBit, 1);
      includedSet.forEach(id=>{
        currentFilter.add(id + cascadeLevel.toString(2).padStart(8, "0") + salted) //we interprete cascadeLevel as 8bit
      });
      filter.push(currentFilter)

      const falsePositives = new Set<string>()
      excludedSet.forEach(id => {
         if(currentFilter.test(id + cascadeLevel.toString(2).padStart(8, "0") + salted)){
                    falsePositives.add(id)
                }
     });
      //for( const id in excludedSet){
      //    if(currentFilter.test(id)){
      //         falsePositives.add(id)
      //    }
      //}
      // if(falsePositives.size < 10){
      //    console.log("false positive", falsePositives)
      // }
      console.log("false positive", falsePositives.size)
      excludedSet = includedSet
      includedSet = falsePositives
      cascadeLevel++;
   }
     
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

export function isInBFC(value:string, bfc:BloomFilterCascade): boolean {
  for(const bloomFilter of bfc){
     if(bloomFilter.test(value)){
          return true;
     }
  }
  return false;
}

//TODO: Chan, can you please also check how to do the serialization. I dont understand how it is serialized. If you dont understant either, maybe it is better to create our own bloom filter 
// export function toBytes(bfc:BloomFilterCascade): number[] {
//      for(const bloomFilter of bfc){
//       var currentFilter = [].slice.call(bloomFilter.buckets)
//        console.log("Serialized filter",JSON.stringify(bloomFilter.buckets) )
//        }
  
//  return []

// }

// toBytes(result[0])



//There is no byte type in typescript
// export function fromBytes(serialized:byte[]): BloomFilterCascade { 
// }