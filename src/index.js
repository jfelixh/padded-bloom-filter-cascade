"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructBFC = constructBFC;
exports.isInBFC = isInBFC;
exports.serializeBloomFilterCascade = serializeBloomFilterCascade;
exports.deserializeBloomFilterCascade = deserializeBloomFilterCascade;
var crypto_1 = require("crypto");
var BloomFilter = require('bloom-filters').BloomFilter;
var hex_to_bin_1 = require("hex-to-bin");
// type BloomFilterCascade = BloomFilter[];
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
    //Why is this falsepositive_last needed?
    var falsepostive_last = 0;
    var _loop_1 = function () {
        var sizeInBit = (-1.0 * includedSet.size * Math.log(cascadeLevel === 1 ? pa : pb)) / (Math.log(2) * Math.log(2));
        console.log(sizeInBit);
        var currentFilter = new BloomFilter(sizeInBit, 1);
        includedSet.forEach(function (id) {
            currentFilter.add(id + cascadeLevel.toString(2).padStart(8, "0") + salted); //we interprete cascadeLevel as 8bit
        });
        filter.push(currentFilter);
        var falsePositives = new Set();
        excludedSet.forEach(function (id) {
            if (currentFilter.has(id + cascadeLevel.toString(2).padStart(8, "0") + salted)) {
                falsePositives.add(id);
            }
        });
        console.log("false positive", falsePositives.size);
        excludedSet = includedSet;
        includedSet = falsePositives;
        cascadeLevel++;
        falsepostive_last = falsePositives.size;
    };
    while (includedSet.size > 0) {
        _loop_1();
    }
    console.log([filter, salted]);
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
        if (bloomFilter.has(value)) {
            return true;
        }
    }
    return false;
}
function serializeBloomFilterCascade(bfc) {
    bfc[0].forEach(function (filter) {
        // Transform bloomFilterCascade to JSON format 
        filter.toJSON = function () {
            // Convert each element of _filter.array to an 8-bit binary string
            var binaryContent = Object.values(filter._filter.array).map(function (byte) { return byte.toString(2).padStart(8, '0'); });
            // The JSON for each filter should contain only the size and the bits in the filter
            return {
                filter: {
                    size: this._filter.size,
                    content: binaryContent
                }
            };
        };
    });
    // The serialized object at the end should contain the size of BloomFilterCascade, the salt, and every bloomFilter
    // JSON is a better approach then byte[] because we dont need to use length encoding
    var serializedArray = JSON.stringify({ sizeBloomFilterCascade: bfc[0].length, salt: bfc[1], bloomFilters: bfc[0] });
    return serializedArray;
}
function deserializeBloomFilterCascade(serialized) {
    // Transform JSON to object
    var parsedData = JSON.parse(serialized);
    // Transform each value of the bloom filter to decimal (see serialization method for more info)
    var bloomFilters = parsedData.bloomFilters.map(function (filterData) {
        var byteArray = filterData.filter.content.map(function (binaryString) { return parseInt(binaryString, 2); });
        // Create a new filter with the decimal data 
        var filter = new BloomFilter(filterData.filter.size);
        filter._filter.array = byteArray;
        return filter;
    });
    return [bloomFilters, parsedData.salt];
}
