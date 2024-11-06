"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructBFC = constructBFC;
exports.isInBFC = isInBFC;
var crypto_1 = require("crypto");
var bloomfilter_1 = require("bloomfilter");
function generateRandom256BitString() {
    var bytes = (0, crypto_1.randomBytes)(32);
    return Array.from(bytes)
        .map(function (byte) { return byte.toString(2).padStart(8, '0'); })
        .join('');
}
function convertHexToBinary(hex) {
    return (parseInt(hex, 16).toString(2)).padStart(8, '0');
}
function convertSetToBinary(set) {
    var resultSet = new Set();
    for (var id in set) {
        resultSet.add(convertHexToBinary(id));
    }
    return resultSet;
}
function drawNFromSet(validIds, revokedIds, neededIteration) {
    for (var i = 0; i < neededIteration;) {
        var bytes = (0, crypto_1.randomBytes)(32);
        var randomId = Array.from(bytes).map(function (byte) { return byte.toString(2).padStart(8, "0"); }).join("");
        if (!validIds.has(randomId) && !revokedIds.has(randomId)) {
            validIds.add(randomId);
            i++;
        }
    }
}
function constructBFC(validIds, revokedIds, rHat) {
    if ((validIds === null || validIds === void 0 ? void 0 : validIds.size) > rHat || (revokedIds === null || revokedIds === void 0 ? void 0 : revokedIds.size) > 2 * rHat) {
        console.log("Error: Requirements not fulfilled. Returning empty array");
        return [[], "0"];
    }
    var sHat = 2 * rHat;
    var neededR = rHat - (validIds === null || validIds === void 0 ? void 0 : validIds.size);
    var neededS = sHat - (revokedIds === null || revokedIds === void 0 ? void 0 : revokedIds.size);
    validIds = convertSetToBinary(validIds);
    revokedIds = convertSetToBinary(revokedIds);
    drawNFromSet(validIds, revokedIds, neededR);
    drawNFromSet(validIds, revokedIds, neededS);
    var salted = generateRandom256BitString();
    var pb = 0.5;
    var pa = Math.sqrt(0.5) / 2;
    var includedSet = validIds;
    var excludedSet = revokedIds;
    var filter = [];
    var cascadeLevel = 1;
    while (includedSet.size > 0) {
        var currentFilter = new bloomfilter_1.BloomFilter(includedSet.size, cascadeLevel === 1 ? pa : pb);
        for (var id in includedSet) {
            currentFilter.add(id + cascadeLevel.toString(2).padStart(8, "0") + salted); //we interprete cascadeLevel as 8bit
        }
        filter.push(currentFilter);
        var falsePositives = new Set();
        for (var id in excludedSet) {
            if (currentFilter.test(id)) {
                falsePositives.add(id);
            }
        }
        excludedSet = includedSet;
        includedSet = falsePositives;
        cascadeLevel++;
    }
    return [
        filter, salted
    ];
}
var result = constructBFC(new Set(["1", "4", "5"]), new Set(["2", "3", "6", "7", "8"]), 3);
console.log(result);
function isInBFC(value, bfc) {
    for (var _i = 0, bfc_1 = bfc; _i < bfc_1.length; _i++) {
        var bloomFilter = bfc_1[_i];
        if (bloomFilter.test(value)) {
            return true;
        }
    }
    return false;
}
// export function toBytes(bfc:BloomFilterCascade): byte[] {
//      for(const bloomFilter of bfc){
//           return []
//        }
// }
//There is no byte type in typescript
// export function fromBytes(serialized:byte[]): BloomFilterCascade { 
// }
