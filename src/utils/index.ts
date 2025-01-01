import { randomBytes } from "crypto";
import hex2Bin from "hex-to-bin";

export function generateRandom256BitString(): string {
  const bytes = randomBytes(32);
  return Array.from(bytes)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("");
}

// important: numbers are to big and therefore we have not precise results. Use hex2Bin instead
export function convertSetToBinary(set: Set<string>): Set<string> {
  const resultSet = new Set<string>();
  set.forEach((id) => {
    resultSet.add(hex2Bin(id));
  });
  return resultSet;
}

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
