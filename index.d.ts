import { type BloomFilter } from "bloomfilter";

declare module "padded-bloom-filter-cascade" {
  export function isInBFC(
    value: string,
    bfc: BloomFilter[],
    salted: string
  ): boolean;
  export function constructBFC(
    validIds: Set<string>,
    revokedIds: Set<string>,
    rHat: number
  ): [BloomFilter[], string];
  export function toDataHexString(bfc: [BloomFilter[], string]): string;
  export function fromDataHexString(
    serialized: string
  ): [BloomFilter[], string];
  export function generateRandom256BitString(): string;
  export function convertSetToBinary(set: Set<string>): Set<string>;
  export function drawNFromSet(
    validIds: Set<string>,
    revokedIds: Set<string>,
    neededIteration: number,
    addToValidIds: boolean
  );
  export function binaryStringToBuffer(binaryString: string): Buffer;
}
