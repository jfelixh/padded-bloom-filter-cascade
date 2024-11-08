"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructBFC = constructBFC;
exports.isInBFC = isInBFC;
var crypto_1 = require("crypto");
var bloomfilter_1 = require("bloomfilter");
var hex_to_bin_1 = require("hex-to-bin");
function generateRandom256BitString() {
    var bytes = (0, crypto_1.randomBytes)(32);
    return Array.from(bytes)
        .map(function (byte) { return byte.toString(2).padStart(8, '0'); })
        .join('');
}
// // imporant: numbers are to big and therefore we have not precise results if using this function. Use hex2Bin instead
//  function convertHexToBinary(hex: string): string {
//     return (parseInt(hex, 16).toString(2)).padStart(8, '0') 
//  }
function convertSetToBinary(set) {
    var resultSet = new Set();
    set.forEach(function (id) {
        resultSet.add((0, hex_to_bin_1.default)(id));
    });
    //for(let i=0;i<set.size;i++){// NOT WORKING
    //    resultSet.add(convertHexToBinary(""))//TODO
    //}
    return resultSet;
}
function drawNFromSet(validIds, revokedIds, neededIteration, addToValidIds) {
    for (var i = 0; i < neededIteration;) {
        var randomId = generateRandom256BitString();
        if (!validIds.has(randomId) && !revokedIds.has(randomId)) {
            if (addToValidIds) {
                validIds.add(randomId);
            }
            else {
                revokedIds.add(randomId);
            }
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
    drawNFromSet(validIds, revokedIds, neededR, true);
    drawNFromSet(validIds, revokedIds, neededS, false);
    var salted = generateRandom256BitString();
    var pb = 0.5;
    var pa = Math.sqrt(0.5) / 2;
    var includedSet = validIds;
    var excludedSet = revokedIds;
    var filter = [];
    var cascadeLevel = 1;
    var _loop_1 = function () {
        var sizeInBit = (-1.0 * includedSet.size * Math.log(cascadeLevel === 1 ? pa : pb)) / (Math.log(2) * Math.log(2));
        var currentFilter = new bloomfilter_1.BloomFilter(sizeInBit, 1);
        includedSet.forEach(function (id) {
            currentFilter.add(id + cascadeLevel.toString(2).padStart(8, "0") + salted); //we interprete cascadeLevel as 8bit
        });
        filter.push(currentFilter);
        var falsePositives = new Set();
        excludedSet.forEach(function (id) {
            if (currentFilter.test(id + cascadeLevel.toString(2).padStart(8, "0") + salted)) {
                falsePositives.add(id);
            }
        });
        //for( const id in excludedSet){
        //    if(currentFilter.test(id)){
        //         falsePositives.add(id)
        //    }
        //}
        // if(falsePositives.size < 10){
        //    console.log("false positive", falsePositives)
        // }
        console.log("false positive", falsePositives.size);
        excludedSet = includedSet;
        includedSet = falsePositives;
        cascadeLevel++;
    };
    while (includedSet.size > 0) {
        _loop_1();
    }
    return [
        filter, salted
    ];
}
var validTestSet = new Set();
for (var i = 1; i <= 100000; i++) {
    var randomHex = '';
    var hexLength = 64;
    // Generate a 64-character (32-byte) hex value
    for (var i_1 = 0; i_1 < hexLength / 8; i_1++) {
        // Generate a random 8-character hex segment
        var segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
        randomHex += segment;
    }
    validTestSet.add(randomHex); // Convert each number to a string and add it to the Set
}
var invalidTestSet = new Set();
for (var i = 100000; i <= 300000; i++) {
    var hexLength = 64; // Desired length of each hex value
    var randomHex = '';
    // Generate a 64-character (32-byte) hex value
    for (var i_2 = 0; i_2 < hexLength / 8; i_2++) {
        // Generate a random 8-character hex segment
        var segment = Math.floor((Math.random() * 0xFFFFFFFF)).toString(16).padStart(8, '0');
        randomHex += segment;
    }
    invalidTestSet.add(randomHex); // Convert each number to a string and add it to the Set
}
var result = constructBFC(validTestSet, invalidTestSet, 100001);
//console.log(result)
function isInBFC(value, bfc) {
    for (var _i = 0, bfc_1 = bfc; _i < bfc_1.length; _i++) {
        var bloomFilter = bfc_1[_i];
        if (bloomFilter.test(value)) {
            return true;
        }
    }
    return false;
}
//TODO: Chan, can you please also check how to do the serialization. I dont understand how it is serialized. If you dont understant either, maybe it is better to create our own bloom filter 
// export function toBytes(bfc:BloomFilterCascade): number[] {
//      for(const bloomFilter of bfc){
//       var currentFilter = [].slice.call(bloomFilter.buckets)
//        console.log("Serialized filter",JSON.stringify(bloomFilter.buckets) )
//        }
//  return []
// }
// toBytes(result[0])
//There is no byte type in typescript
// export function fromBytes(serialized:byte[]): BloomFilterCascade { 
// }
