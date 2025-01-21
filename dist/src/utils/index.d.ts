/**
 * Generates a random 256-bit binary string.
 *
 * This function creates a 256-bit string by generating 32 random bytes
 * and converting each byte to its binary representation, ensuring each
 * byte is represented by 8 bits.
 *
 * @returns {string} A 256-bit binary string.
 */
export declare function generateRandom256BitString(): string;
/**
 * Converts a set of hexadecimal strings to a set of binary strings.
 *
 * @param {Set<string>} set - The set of hexadecimal strings to be converted.
 * @returns {Set<string>} A new set containing the binary string representations of the input hexadecimal strings.
 */
export declare function convertSetToBinary(set: Set<string>): Set<string>;
/**
 * Draws a specified number of unique random IDs and adds them to either the valid or revoked set.
 *
 * @param {Set<string>} validIds - A set of valid IDs.
 * @param {Set<string>} revokedIds - A set of revoked IDs.
 * @param {number} neededIteration - The number of unique IDs to generate and add.
 * @param {boolean} addToValidIds - If true, adds the generated IDs to the validIds set; otherwise, adds them to the revokedIds set.
 */
export declare function drawNFromSet(validIds: Set<string>, revokedIds: Set<string>, neededIteration: number, addToValidIds: boolean): void;
/**
 * Converts a binary string to a Buffer.
 *
 * @param {string} binaryString - The binary string to be converted.
 * @returns {Buffer} A Buffer containing the binary string.
 */
export declare function binaryStringToBuffer(binaryString: string): Buffer;
//# sourceMappingURL=index.d.ts.map