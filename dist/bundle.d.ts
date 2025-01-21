import { BloomFilter } from 'bloomfilter';

/**
 * Constructs a Bloom Filter Cascade (BFC) from the given sets of valid and revoked IDs.
 *
 * @param validIds - A set of valid IDs.
 * @param revokedIds - A set of revoked IDs.
 * @param rHat - Padding size r hat, where `rHat >= |validElements|`. Achieved by padding with random IDs.
 * @returns A tuple containing an array of BloomFilters and a salted string.
 *
 * The function performs the following steps:
 * 1. Checks if the sizes of validIds and revokedIds meet the requirements.
 * 2. Converts the sets of valid and revoked IDs to binary format.
 * 3. Draws the required number of elements from the sets.
 * 4. Generates a random 256-bit salted string.
 * 5. Constructs the Bloom Filter Cascade by iteratively creating Bloom Filters
 *    and testing for false positives.
 *
 * If the requirements are not fulfilled, it returns an empty array and a "0" string.
 */
declare function constructBFC(validIds: Set<string>, revokedIds: Set<string>, rHat: number): [BloomFilter[], string];
/**
 * Checks if a given value is in the Bloom Filter Cascade (BFC).
 *
 * @param value - The value to check in the BFC.
 * @param bfc - An array of BloomFilter objects representing the cascade.
 * @param salted - A salted string used in the Bloom Filter test.
 * @returns `true` if the value is in the BFC, `false` otherwise.
 */
declare function isInBFC(value: string, bfc: BloomFilter[], salted: string): boolean;
/**
 * Converts a Bloom Filter Cascade (BFC) to a hexadecimal string representation.
 *
 * @param { [BloomFilter[], string] } bfc - A tuple containing an array of BloomFilters and a salt string.
 * @returns { string } - The hexadecimal string representation of the serialized Bloom Filter Cascade.
 *
 * The function performs the following steps:
 * 1. Serializes each BloomFilter in the cascade by converting its buckets to a buffer and prefixing it with its length.
 * 2. Converts the salt string to a buffer.
 * 3. Concatenates the serialized BloomFilters and the salt buffer.
 * 4. Returns the concatenated buffer as a hexadecimal string prefixed with "0x".
 */
declare function toDataHexString(bfc: [BloomFilter[], string]): string;
/**
 * Deserializes a hex string into an array of Bloom filters and a salt string.
 *
 * @param serialized - The hex string to deserialize. It should start with "0x".
 * @returns A tuple containing an array of BloomFilter objects and a salt string.
 *
 * The hex string is expected to be in the following format:
 * - The first 32 bytes represent the salt.
 * - The remaining bytes represent the Bloom filters, each prefixed with a 4-byte length.
 *
 * The function performs the following steps:
 * 1. Converts the hex string to a buffer.
 * 2. Extracts the first 32 bytes as the salt.
 * 3. Iterates over the remaining buffer to extract Bloom filters.
 * 4. For each Bloom filter, reads the length prefix and the filter content.
 * 5. Creates a new BloomFilter object and sets its buckets from the filter content.
 * 6. Returns the array of BloomFilter objects and the salt string.
 */
declare function fromDataHexString(serialized: string): [BloomFilter[], string];

/**
 * Generates a random 256-bit binary string.
 *
 * This function creates a 256-bit string by generating 32 random bytes
 * and converting each byte to its binary representation, ensuring each
 * byte is represented by 8 bits.
 *
 * @returns {string} A 256-bit binary string.
 */
declare function generateRandom256BitString(): string;
/**
 * Converts a set of hexadecimal strings to a set of binary strings.
 *
 * @param {Set<string>} set - The set of hexadecimal strings to be converted.
 * @returns {Set<string>} A new set containing the binary string representations of the input hexadecimal strings.
 */
declare function convertSetToBinary(set: Set<string>): Set<string>;
/**
 * Draws a specified number of unique random IDs and adds them to either the valid or revoked set.
 *
 * @param {Set<string>} validIds - A set of valid IDs.
 * @param {Set<string>} revokedIds - A set of revoked IDs.
 * @param {number} neededIteration - The number of unique IDs to generate and add.
 * @param {boolean} addToValidIds - If true, adds the generated IDs to the validIds set; otherwise, adds them to the revokedIds set.
 */
declare function drawNFromSet(validIds: Set<string>, revokedIds: Set<string>, neededIteration: number, addToValidIds: boolean): void;
/**
 * Converts a binary string to a Buffer.
 *
 * @param {string} binaryString - The binary string to be converted.
 * @returns {Buffer} A Buffer containing the binary string.
 */
declare function binaryStringToBuffer(binaryString: string): Buffer;

export { binaryStringToBuffer, constructBFC, convertSetToBinary, drawNFromSet, fromDataHexString, generateRandom256BitString, isInBFC, toDataHexString };
