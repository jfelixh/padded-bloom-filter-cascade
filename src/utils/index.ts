import { randomBytes } from "crypto";
import hex2Bin from "hex-to-bin";

/**
 * Generates a random 256-bit binary string.
 *
 * This function creates a 256-bit string by generating 32 random bytes
 * and converting each byte to its binary representation, ensuring each
 * byte is represented by 8 bits.
 *
 * @returns {string} A 256-bit binary string.
 */
export function generateRandom256BitString(): string {
  const bytes = randomBytes(32);
  return Array.from(bytes)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("");
}

/**
 * Converts a set of hexadecimal strings to a set of binary strings.
 *
 * @param {Set<string>} set - The set of hexadecimal strings to be converted.
 * @returns {Set<string>} A new set containing the binary string representations of the input hexadecimal strings.
 */
export function convertSetToBinary(set: Set<string>): Set<string> {
  const resultSet = new Set<string>();
  // Using hex2Bin to ensure precise conversion of large hexadecimal numbers to binary.
  set.forEach((id) => {
    resultSet.add(hex2Bin(id));
  });
  return resultSet;
}

/**
 * Draws a specified number of unique random IDs and adds them to either the valid or revoked set.
 *
 * @param {Set<string>} validIds - A set of valid IDs.
 * @param {Set<string>} revokedIds - A set of revoked IDs.
 * @param {number} neededIteration - The number of unique IDs to generate and add.
 * @param {boolean} addToValidIds - If true, adds the generated IDs to the validIds set; otherwise, adds them to the revokedIds set.
 */
export function drawNFromSet(
  validIds: Set<string>,
  revokedIds: Set<string>,
  neededIteration: number,
  addToValidIds: boolean
) {
  for (let i = 0; i < neededIteration; ) {
    const randomId = generateRandom256BitString();
    if (!validIds.has(randomId) && !revokedIds.has(randomId)) {
      if (addToValidIds) {
        validIds.add(randomId);
      } else {
        revokedIds.add(randomId);
      }
      i++;
    }
  }
}

/**
 * Converts a binary string to a Buffer.
 *
 * @param {string} binaryString - The binary string to be converted.
 * @returns {Buffer} A Buffer containing the binary string.
 */
export function binaryStringToBuffer(binaryString: string): Buffer {
  const byteArray = [];

  // Add padding to binary string if necessary
  const paddedBinaryString = binaryString.padStart(
    Math.ceil(binaryString.length / 8) * 8,
    "0"
  );

  // Convert every 8 bits into a byte (number)
  for (let i = 0; i < paddedBinaryString.length; i += 8) {
    const byte = paddedBinaryString.slice(i, i + 8);
    byteArray.push(parseInt(byte, 2));
  }

  return Buffer.from(byteArray);
}
