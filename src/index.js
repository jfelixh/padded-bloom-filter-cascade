"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSetToBinary = convertSetToBinary;
exports.drawNFromSet = drawNFromSet;
exports.constructBFC = constructBFC;
exports.isInBFC = isInBFC;
exports.serializeBloomFilterCascade = serializeBloomFilterCascade;
exports.toDataHexString = toDataHexString;
exports.deserializeBloomFilterCascade = deserializeBloomFilterCascade;
exports.fromDataHexString = fromDataHexString;
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
    console.log("logging before converting them to binary");
    console.log(validIds);
    validIds = convertSetToBinary(validIds);
    revokedIds = convertSetToBinary(revokedIds);
    console.log("logging after converting them to binary");
    console.log(validIds);
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
function binaryStringToBuffer(binaryString) {
    var byteArray = [];
    // Add padding to binary string if necessary
    var paddedBinaryString = binaryString.padStart(Math.ceil(binaryString.length / 8) * 8, '0');
    // Convert every 8 bits into a byte (number)
    for (var i = 0; i < paddedBinaryString.length; i += 8) {
        var byte = paddedBinaryString.slice(i, i + 8);
        byteArray.push(parseInt(byte, 2));
    }
    return Buffer.from(byteArray);
}
function toDataHexString(bfc) {
    var serializedCascade = bfc[0].map(function (filter) {
        // Create and fill the buffer with the filter content
        var currentFilterBuffer = Buffer.from(filter._filter.array);
        // Allocate 4 Bytes for lengthPrefix. The more items we have, the bigger the length would be
        var lengthPrefix = Buffer.alloc(4);
        lengthPrefix.writeUInt32BE(currentFilterBuffer.length, 0); // Store the length in the Buffer using big endian
        // For each filter concatinate the filter itself with its length
        return Buffer.concat([lengthPrefix, currentFilterBuffer]);
    });
    // Create a Buffer to store the salt
    var serializedSalt = binaryStringToBuffer(bfc[1]);
    // Create a Buffer from the array of Buffers
    var serializedCascadeBuffer = Buffer.concat(serializedCascade);
    // Concatinate the salt and the buffer of filterCascade
    var serializedArray = Buffer.concat([serializedSalt, serializedCascadeBuffer]);
    // Return a string hex value
    return "0x".concat(serializedArray.toString('hex'));
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
function fromDataHexString(serialized) {
    // Create a buffer from the string hex value by first removing 0x
    var buffer = Buffer.from(serialized.slice(2), 'hex');
    // Extract the salt - the first 32 bytes
    var saltBuffer = buffer.subarray(0, 32);
    var salt = Array.from(saltBuffer).map(function (byte) { return byte.toString(2).padStart(8, '0'); }).join('');
    var bloomFilters = [];
    var startIndex = 32;
    while (startIndex < buffer.length) {
        // Read the length which takes 4 bytes
        var lengthPrefix = buffer.readUInt32BE(startIndex);
        startIndex += 4;
        // Read the Bloom filter content 
        var filterContent = buffer.subarray(startIndex, startIndex + lengthPrefix);
        startIndex += lengthPrefix;
        // Create a new bloom filter of size in bits and store the filter content
        var currentFilter = new BloomFilter(filterContent.length * 8);
        currentFilter._filter.array = Array.from(filterContent);
        bloomFilters.push(currentFilter);
    }
    return [bloomFilters, salt];
}
fromDataHexString(toDataHexString(result));
