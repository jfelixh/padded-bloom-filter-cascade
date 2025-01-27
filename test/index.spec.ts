import {
  constructBFC,
  convertSetToBinary,
  fromDataHexString,
  isInBFC,
  toDataHexString,
} from "../src";
import { BloomFilter } from "../bloomfilter-sha256";
import * as path from "path";
import * as fs from "fs";

let validTestSet = new Set<string>();
for (let i = 1; i <= 180000; i++) {
  let randomHex = "";
  const hexLength = 64;

  // Generate a 64-character (32-byte) hex value
  for (let i = 0; i < hexLength / 8; i++) {
    // Generate a random 8-character hex segment
    const segment = Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
    randomHex += segment;
  }
  validTestSet.add(randomHex); // Convert each number to a string and add it to the Set
}
let invalidTestSet = new Set<string>();
for (let i = 180000; i <= 540000; i++) {
  const hexLength = 64; // Desired length of each hex value

  let randomHex = "";

  // Generate a 64-character (32-byte) hex value
  for (let i = 0; i < hexLength / 8; i++) {
    // Generate a random 8-character hex segment
    const segment = Math.floor(Math.random() * 0xffffffff)
      .toString(16)
      .padStart(8, "0");
    randomHex += segment;
  }
  invalidTestSet.add(randomHex); // Convert each number to a string and add it to the Set
}
const result = constructBFC(validTestSet, invalidTestSet, 180001);
console.log(result[0].length)
const filePath = path.join("/Users/ichan-yeong/Downloads", "test_data.csv");
const header = "id,status\n"; // CSV header
const rows: string[] = [];

// Add valid entries
validTestSet.forEach((id) => {
  rows.push(`${id},Valid`);
})

// Add invalid entries
invalidTestSet.forEach((id) => {
  rows.push(`${id},Invalid`);
})
// Write the header and rows to the CSV file
fs.writeFileSync(filePath, header + rows.join("\n"), "utf-8");
console.log(`CSV file created at: ${filePath}`);




test('convert set to binary',() => {
  const resultSet = new Set(["602b4b2b81f063d07107772b735810e238007d84df71baf9ad37fe58b4daff38"]);
  const binarySet = convertSetToBinary(resultSet);
  expect(binarySet.size).toBe(1);
  expect(binarySet.values().next().value).toBe("0110000000101011010010110010101110000001111100000110001111010000011100010000011101110111001010110111001101011000000100001110001000111000000000000111110110000100110111110111000110111010111110011010110100110111111111100101100010110100110110101111111100111000");
})

test('if first layer of bloom filter is implemented correctly',()=>{
  const filter=result[0]
  const firstLayer:BloomFilter= filter[0]
  const validTestSetFirst:Set<string> = convertSetToBinary(validTestSet)

  validTestSetFirst.forEach(id=>{
    let cascadeLevel = 1;
    id=id + cascadeLevel.toString(2).padStart(8, "0") + result[1]
    expect(firstLayer.test(id)).toBe(true)
    // expect(isInBFC(id,result[0],result[1])).toBe(true)
  })
})


test('if second layer of bloom filter is implemented correctly',()=>{
  const filter=result[0]
  const firstLayer:BloomFilter= filter[0]
  const secondLayer:BloomFilter= filter[1]
  let invalidTestSetFirst:Set<string>=convertSetToBinary(invalidTestSet)
  let falsePositives = new Set<string>()
  invalidTestSetFirst.forEach(id=>{
    let cascadeLevel = 1;
    const id_test=id + cascadeLevel.toString(2).padStart(8, "0") + result[1]
    if(firstLayer.test(id_test)){
      falsePositives.add(id)
    }
  })
  falsePositives.forEach(id=>{
    let cascadeLevel = 2;
    expect(secondLayer.test(id + cascadeLevel.toString(2).padStart(8, "0") + result[1])).toBe(true)
  })
})

test('checkRequirements', () => {

  const consoleLogSpy = jest.spyOn(console, 'log');
  let validTestSets = new Set<string>();
  for (let i = 1; i <= 1000; i++) {
    let randomHex = '';
    const hexLength = 64;
    // Generate a 64-character (32-byte) hex value
    for (let i = 0; i < hexLength / 8; i++) {
      // Generate a random 8-character hex segment
      const segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
      randomHex += segment;
    }
    validTestSets.add(randomHex); // Convert each number to a string and add it to the Set
  }
  let invalidTestSets = new Set<string>();
  for (let i = 1000; i <= 3000; i++) {
    const hexLength = 64; // Desired length of each hex value

    let randomHex = '';

    // Generate a 64-character (32-byte) hex value
    for (let i = 0; i < hexLength / 8; i++) {
      // Generate a random 8-character hex segment
      const segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
      randomHex += segment;
    }
    invalidTestSets.add(randomHex); // Convert each number to a string and add it to the Set
  }
  const result =constructBFC(validTestSets, invalidTestSets, 800)
  // Check if the correct message was logged
  expect(consoleLogSpy).toHaveBeenCalledWith("Error: Requirements not fulfilled. Returning empty array")
});

test("if the valid VC is in the BLoomfilter with the correct implementation of isInBFC()",()=>{
  validTestSet.forEach(id=>{
    expect(isInBFC(id,result[0],result[1])).toBe(true)
  })
})

test("if the invalid VC is in the BLoomfilter with the correct implementation of isInBFC()",()=>{
  invalidTestSet.forEach(id=>{
    expect(isInBFC(id,result[0],result[1])).toBe(false)
  })
})


test('serialized the bloomfilter correctly', () => {
  //fs.writeFileSync('output.txt', serializeBloomFilterCascade(result), 'utf8');
  const deserializedResult=fromDataHexString(toDataHexString(result))
  for(let i=0;i<deserializedResult[0].length;i++){
    deserializedResult[0][i]._locations=result[0][i]._locations;
  }
  expect(result[1]).toStrictEqual(deserializedResult[1])
  expect(result[0]).toStrictEqual(deserializedResult[0])
})

test('see if serialized deserialized bloomfilter works properly', () => {
  //fs.writeFileSync('output.txt', serializeBloomFilterCascade(result), 'utf8');
  const deserializedResult=fromDataHexString(toDataHexString(result))
  validTestSet.forEach(id=>{
    expect(isInBFC(id,deserializedResult[0],deserializedResult[1])).toBe(true)
  })
  invalidTestSet.forEach(id=>{
    expect(isInBFC(id,deserializedResult[0],deserializedResult[1])).toBe(false)
  })
})
