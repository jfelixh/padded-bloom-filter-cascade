import hex2Bin from "hex-to-bin";
import { BloomFilter } from "../../bloomfilter-sha256";
import {
  binaryStringToBuffer,
  convertSetToBinary,
  drawNFromSet,
  generateRandom256BitString,
} from "../utils";

export function constructBFC(
  validIds: Set<string>,
  revokedIds: Set<string>,
  rHat: number
): [BloomFilter[], string, number] {
  if (validIds?.size > rHat || revokedIds?.size > 2 * rHat) {
    console.log("Error: Requirements not fulfilled. Returning empty array");
    return [[], "0", 0];
  }
  const sHat = 2 * rHat;
  const neededR = rHat - validIds?.size;
  const neededS = sHat - revokedIds?.size;

  validIds = convertSetToBinary(validIds);
  revokedIds = convertSetToBinary(revokedIds);

  drawNFromSet(validIds, revokedIds, neededR, true);
  drawNFromSet(validIds, revokedIds, neededS, false);

  const salted = generateRandom256BitString();

  const pb = 0.5;
  const pa = Math.sqrt(0.5) / 2;

  let includedSet = validIds;
  let excludedSet = revokedIds;
  let filter: BloomFilter[] = [];
  let cascadeLevel = 1;
  while (includedSet.size > 0) {
    const sizeInBit =
      (-1.0 * includedSet.size * Math.log(cascadeLevel === 1 ? pa : pb)) /
      (Math.log(2) * Math.log(2));
    console.log(sizeInBit);
    const currentFilter = new BloomFilter(sizeInBit, 1);
    includedSet.forEach((id) => {
      currentFilter.add(
        id + cascadeLevel.toString(2).padStart(8, "0") + salted
      ); //we interprete cascadeLevel as 8bit
    });
    filter.push(currentFilter);
    let falsePositives = new Set<string>();
    excludedSet.forEach((id) => {
      if (
        currentFilter.test(
          id + cascadeLevel.toString(2).padStart(8, "0") + salted
        )
      ) {
        falsePositives.add(id);
      }
    });
    excludedSet = includedSet;
    includedSet = falsePositives;
    cascadeLevel++;
  }
  return [filter, salted, filter.length];
}

export function isInBFC(
  value: string,
  bfc: BloomFilter[],
  salted: string
): boolean {
  let cascadeLevel = 0;
  let id = hex2Bin(value);
  for (let i = 0; i < bfc.length; i++) {
    cascadeLevel++;
    if (!bfc[i].test(id + cascadeLevel.toString(2).padStart(8, "0") + salted)) {
      return cascadeLevel % 2 === 0;
    }
  }
  return !(cascadeLevel % 2 === 0);
}

export function toDataHexString(bfc: [BloomFilter[], string, number]): string {
  const serializedCascade = bfc[0].map((filter) => {
    // Serialization from npm documentation
    var array = [].slice.call(filter.buckets);

    // Create and fill the buffer with the filter content
    const buffer =
      filter.buckets instanceof Int32Array ? filter.buckets.buffer : null;
    const currentFilterBuffer = Buffer.from(buffer!);

    // Allocate 4 Bytes for lengthPrefix. The more items we have, the bigger the length would be
    const lengthPrefix = Buffer.alloc(4);
    lengthPrefix.writeUInt32BE(currentFilterBuffer.length, 0); // Store the length in the Buffer using big endian
    // For each filter concatinate the filter itself with its length
    return Buffer.concat([lengthPrefix, currentFilterBuffer]);
  });

  // Create a Buffer to store the salt
  const serializedSalt = binaryStringToBuffer(bfc[1]);
  // Create a Buffer from the array of Buffers
  const serializedCascadeBuffer = Buffer.concat(serializedCascade);
  // Concatinate the salt and the buffer of filterCascade
  const serializedArray = Buffer.concat([
    serializedSalt,
    serializedCascadeBuffer
  ]);
  // Return a string hex value
  return `0x${serializedArray.toString("hex")}`;
}

export function fromDataHexString(serialized: string): [BloomFilter[], string,number] {
  // Create a buffer from the string hex value by first removing 0x
  const buffer = Buffer.from(serialized.slice(2), "hex");

  // Extract the salt - the first 32 bytes
  const saltBuffer = buffer.subarray(0, 32);
  const salt = Array.from(saltBuffer)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("");

  const bloomFilters: BloomFilter[] = [];

  let startIndex = 32;
  while (startIndex < buffer.length) {
    // Read the length which takes 4 bytes
    const lengthPrefix = buffer.readUInt32BE(startIndex);
    startIndex += 4;

    // Read the Bloom filter content
    const filterContent = buffer.subarray(
      startIndex,
      startIndex + lengthPrefix
    );
    startIndex += lengthPrefix;

    // Create a new bloom filter of size in bits and number of hash functions and store the filter content
    const currentFilter = new BloomFilter(filterContent.length * 8, 1);
    // Buckets is of type Int32Array, so we have to convert the buffer back to Int32Array
    currentFilter.buckets = new Int32Array(
      filterContent.buffer,
      filterContent.byteOffset,
      filterContent.byteLength / Int32Array.BYTES_PER_ELEMENT
    );
    bloomFilters.push(currentFilter);
  }
  return [bloomFilters, salt, bloomFilters.length];
}
