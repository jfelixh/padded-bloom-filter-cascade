import { BloomFilter } from "bloom-filters";
import { serialize } from "v8";

const methods = require('./index');

test('convert set to binary',() => {
    const resultSet = new Set(["602b4b2b81f063d07107772b735810e238007d84df71baf9ad37fe58b4daff38"]);
    const binarySet = methods.convertSetToBinary(resultSet);
    expect(binarySet.size).toBe(1);
    expect(binarySet.size).toBe(1)
    expect(binarySet.values().next().value).toBe("0110000000101011010010110010101110000001111100000110001111010000011100010000011101110111001010110111001101011000000100001110001000111000000000000111110110000100110111110111000110111010111110011010110100110111111111100101100010110100110110101111111100111000")
    })

test('draws n sets of random',()=>{

})
test('if first layer of bloom filter is implemented correctly',()=>{
let validTestSet = new Set<string>();
for (let i = 1; i <= 1000; i++) {
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
for (let i = 1000; i <= 3000; i++) {
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
const result = methods.constructBFC(validTestSet, invalidTestSet, 1001)
const filter=result[0]
const firstLayer:BloomFilter= filter[0]
validTestSet = methods.convertSetToBinary(validTestSet)
validTestSet.forEach(id=>{
    let cascadeLevel = 1;
    id=id + cascadeLevel.toString(2).padStart(8, "0") + result[1]
    expect(firstLayer.has(id)).toBe(true)
})
})


test('if second layer of bloom filter is implemented correctly',()=>{
    let validTestSet = new Set<string>();
    for (let i = 1; i <= 1000; i++) {
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
    for (let i = 1000; i <= 3000; i++) {
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
    const result = methods.constructBFC(validTestSet, invalidTestSet, 1001)
    const filter=result[0]
    const firstLayer:BloomFilter= filter[0]
    const secondLayer:BloomFilter= filter[1]
    validTestSet = methods.convertSetToBinary(validTestSet)
    invalidTestSet=methods.convertSetToBinary(invalidTestSet)
    let falsePositives = new Set<string>()
    invalidTestSet.forEach(id=>{
        let cascadeLevel = 1;
        const id_test=id + cascadeLevel.toString(2).padStart(8, "0") + result[1]
        if(firstLayer.has(id_test)){
            falsePositives.add(id)
        }
    })
    falsePositives.forEach(id=>{
        let cascadeLevel = 2;
        expect(secondLayer.has(id + cascadeLevel.toString(2).padStart(8, "0") + result[1])).toBe(true)
    })
    })
    test('checkRequirements', () => {
         
        const consoleLogSpy = jest.spyOn(console, 'log');
      
         
        let validTestSet = new Set<string>();
        for (let i = 1; i <= 1000; i++) {
            let randomHex = '';
            const hexLength = 64;
            // Generate a 64-character (32-byte) hex value
            for (let i = 0; i < hexLength / 8; i++) {
                // Generate a random 8-character hex segment
                const segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
                randomHex += segment;
            }
        validTestSet.add(randomHex); 
        }
        let invalidTestSet = new Set<string>();
        for (let i = 1000; i <= 3000; i++) {
        const hexLength = 64; // Desired length of each hex value
        
            let randomHex = '';
            
            // Generate a 64-character (32-byte) hex value
            for (let i = 0; i < hexLength / 8; i++) {
                // Generate a random 8-character hex segment
                const segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
                randomHex += segment;
            }
        invalidTestSet.add(randomHex); 
        }
        const result = methods.constructBFC(validTestSet, invalidTestSet, 100)
      
          // Check if the correct message was logged
          expect(consoleLogSpy).toHaveBeenCalledWith("Error: Requirements not fulfilled. Returning empty array")

              });
    test('serialized the bloomfilter correctly', () => {
        let validTestSet = new Set<string>();
    for (let i = 1; i <= 1000; i++) {
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
    for (let i = 1000; i <= 3000; i++) {
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
    const result = methods.constructBFC(validTestSet, invalidTestSet, 1001)
    console.log(serialize(result))
        })