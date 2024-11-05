"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructBFC = constructBFC;
function constructBFC(validIds, revokedIds, rHat) {
    if ((validIds === null || validIds === void 0 ? void 0 : validIds.size) > rHat || (revokedIds === null || revokedIds === void 0 ? void 0 : revokedIds.size) > 2 * rHat) {
        console.log("Error: Requirements not fulfilled");
        throw new Error("Requirements not fulfilled");
    }
    var sHat = 2 * rHat;
    var randomIds = [];
    for (var i = 0; i < 100000; i++) {
        var bytes = new Uint8Array(32);
        // load cryptographically random bytes into array
        window.crypto.getRandomValues(bytes);
        // convert byte array to hexademical representation
        var bytesHex = bytes.reduce(function (o, v) { return o + ('00' + v.toString(16)).slice(-2); }, '');
        // convert hexademical value to a decimal string
        randomIds.push(BigInt('0x' + bytesHex).toString(10));
        console.log("RandomIds", JSON.stringify(randomIds));
    }
    return [];
}
var result = constructBFC(new Set(["1", "4", "5"]), new Set(["2", "3", "6", "7", "8"]), 3);
console.log(result);
// export function isInBFC(value:string, bfc:BloomFilterCascade): boolean
// export function toBytes(bfc:BloomFilterCascade): byte[]
// export function fromBytes(serialized:byte[]): BloomFilterCascade
