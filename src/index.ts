import { randomBytes } from 'crypto';
import { BloomFilter } from 'bloom-filters';
type BloomFilterCascade = BloomFilter[];

function generateRandom256BitString(): string { 
     const bytes = randomBytes(32);
     return Array.from(bytes)
        .map(byte => byte.toString(2).padStart(8, '0'))
        .join('');
 }

 function convertHexToBinary(hex: string): string {
    return (parseInt(hex, 16).toString(2)).padStart(8, '0')
 }

 function convertSetToBinary(set: Set<string>): Set<string> {
     const resultSet = new Set<string>()
    for(const id in set){
        resultSet.add(convertHexToBinary(id))
    }
    return resultSet
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
    
    for (let i = 0; i < neededR;) {
      const bytes = randomBytes(32);
       const randomId = Array.from(bytes).map(byte => byte.toString(2).padStart(8, "0")).join("")
       if(!validIds.has(randomId) && !revokedIds.has(randomId)){
          validIds.add(randomId)
          i++;
       }
    }
    for (let i = 0; i < neededS; ) {
      const bytes = randomBytes(32);
      const randomId = Array.from(bytes).map(byte => byte.toString(2).padStart(8, "0")).join("")
      if(!validIds.has(randomId) && !revokedIds.has(randomId)){
          revokedIds.add(randomId)
          i++;
       }
   }
   const salted = generateRandom256BitString()

   const pb = 0.5
   const pa = Math.sqrt(0.5) / 2
   let includedSet = validIds
   let excludedSet = revokedIds
   let filter: BloomFilterCascade = []
   let cascadeLevel = 1;
   while (includedSet.size > 0){
     const currentFilter = new BloomFilter(includedSet.size, cascadeLevel === 1 ? pa : pb);
      for(const id in includedSet){
        currentFilter.add(id + cascadeLevel.toString(2).padStart(8, "0") + salted) //we interprete cascadeLevel as 8bit
      }
      filter.push(currentFilter)
      const falsePositives = new Set<string>()
      for( const id in excludedSet){
          if(currentFilter.has(id)){
               falsePositives.add(id)
          }
      }
      excludedSet = includedSet
      includedSet = falsePositives
      cascadeLevel++;
   }
     
   return [
     filter, salted
   ]
}

const result = constructBFC(new Set(["1", "4", "5"]), new Set(["2", "3", "6", "7", "8"]), 3)
console.log(result)

export function isInBFC(value:string, bfc:BloomFilterCascade): boolean {
  for(const bloomFilter of bfc){
     if(bloomFilter.has(value)){
          return true;
     }
  }
  return false;
}
// export function toBytes(bfc:BloomFilterCascade): byte[] {
//      for(const bloomFilter of bfc){
//           return []
//        }
// }

//There is no byte type in typescript
// export function fromBytes(serialized:byte[]): BloomFilterCascade { 
// }