
type BloomFilterCascade = BloomFilter[];

type BloomFilter = string[]

export function constructBFC(validIds: Set<string>, revokedIds: Set<string>, rHat: number): BloomFilterCascade {
    if(validIds?.size > rHat || revokedIds?.size > 2*rHat){
      console.log("Error: Requirements not fulfilled")
      throw new Error("Requirements not fulfilled")
    }
    const sHat = 2*rHat
    let randomIds: string[] = []
    for (let i = 0; i < 100000; i++ ) {
      const bytes = new Uint8Array(32);
  
  // load cryptographically random bytes into array
       window.crypto.getRandomValues(bytes);
  
  // convert byte array to hexademical representation
       const bytesHex = bytes.reduce((o, v) => o + ('00' + v.toString(16)).slice(-2), '');
  
  // convert hexademical value to a decimal string
       randomIds.push(BigInt('0x' + bytesHex).toString(10))
       console.log("RandomIds", JSON.stringify(randomIds))
    }
 

    return []
}

const result = constructBFC(new Set(["1", "4", "5"]), new Set(["2", "3", "6", "7", "8"]), 3)
console.log(result)

// export function isInBFC(value:string, bfc:BloomFilterCascade): boolean
// export function toBytes(bfc:BloomFilterCascade): byte[]
// export function fromBytes(serialized:byte[]): BloomFilterCascade