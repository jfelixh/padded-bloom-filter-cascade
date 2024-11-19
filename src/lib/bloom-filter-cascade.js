"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.constructBFC = constructBFC;
exports.isInBFC = isInBFC;
exports.toDataHexString = toDataHexString;
exports.fromDataHexString = fromDataHexString;
var hex_to_bin_1 = require("hex-to-bin");
var bloomfilter_sha256_1 = require("../../bloomfilter-sha256");
var utils_1 = require("../utils");
function constructBFC(validIds, revokedIds, rHat) {
    if ((validIds === null || validIds === void 0 ? void 0 : validIds.size) > rHat || (revokedIds === null || revokedIds === void 0 ? void 0 : revokedIds.size) > 2 * rHat) {
        console.log("Error: Requirements not fulfilled. Returning empty array");
        return [[], "0"];
    }
    var sHat = 2 * rHat;
    var neededR = rHat - (validIds === null || validIds === void 0 ? void 0 : validIds.size);
    var neededS = sHat - (revokedIds === null || revokedIds === void 0 ? void 0 : revokedIds.size);
    validIds = (0, utils_1.convertSetToBinary)(validIds);
    revokedIds = (0, utils_1.convertSetToBinary)(revokedIds);
    (0, utils_1.drawNFromSet)(validIds, revokedIds, neededR, true);
    (0, utils_1.drawNFromSet)(validIds, revokedIds, neededS, false);
    var salted = (0, utils_1.generateRandom256BitString)();
    var pb = 0.5;
    var pa = Math.sqrt(0.5) / 2;
    var includedSet = validIds;
    var excludedSet = revokedIds;
    var filter = [];
    var cascadeLevel = 1;
    var _loop_1 = function () {
        var sizeInBit = (-1.0 * includedSet.size * Math.log(cascadeLevel === 1 ? pa : pb)) /
            (Math.log(2) * Math.log(2));
        console.log(sizeInBit);
        var currentFilter = new bloomfilter_sha256_1.BloomFilter(sizeInBit, 1);
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
        excludedSet = includedSet;
        includedSet = falsePositives;
        cascadeLevel++;
    };
    while (includedSet.size > 0) {
        _loop_1();
    }
    return [filter, salted];
}
function isInBFC(value, bfc, salted) {
    var cascadeLevel = 0;
    var id = (0, hex_to_bin_1.default)(value);
    for (var i = 0; i < bfc.length; i++) {
        cascadeLevel++;
        if (!bfc[i].test(id + cascadeLevel.toString(2).padStart(8, "0") + salted)) {
            return cascadeLevel % 2 === 0;
        }
    }
    return !(cascadeLevel % 2 === 0);
}
function toDataHexString(bfc) {
    var serializedCascade = bfc[0].map(function (filter) {
        // Serialization from npm documentation
        var array = [].slice.call(filter.buckets);
        // Create and fill the buffer with the filter content
        var buffer = filter.buckets instanceof Int32Array ? filter.buckets.buffer : null;
        var currentFilterBuffer = Buffer.from(buffer);
        // Allocate 4 Bytes for lengthPrefix. The more items we have, the bigger the length would be
        var lengthPrefix = Buffer.alloc(4);
        lengthPrefix.writeUInt32BE(currentFilterBuffer.length, 0); // Store the length in the Buffer using big endian
        // For each filter concatinate the filter itself with its length
        return Buffer.concat([lengthPrefix, currentFilterBuffer]);
    });
    // Create a Buffer to store the salt
    var serializedSalt = (0, utils_1.binaryStringToBuffer)(bfc[1]);
    // Create a Buffer from the array of Buffers
    var serializedCascadeBuffer = Buffer.concat(serializedCascade);
    // Concatinate the salt and the buffer of filterCascade
    var serializedArray = Buffer.concat([
        serializedSalt,
        serializedCascadeBuffer,
    ]);
    // Return a string hex value
    return "0x".concat(serializedArray.toString("hex"));
}
function fromDataHexString(serialized) {
    // Create a buffer from the string hex value by first removing 0x
    var buffer = Buffer.from(serialized.slice(2), "hex");
    // Extract the salt - the first 32 bytes
    var saltBuffer = buffer.subarray(0, 32);
    var salt = Array.from(saltBuffer)
        .map(function (byte) { return byte.toString(2).padStart(8, "0"); })
        .join("");
    var bloomFilters = [];
    var startIndex = 32;
    while (startIndex < buffer.length) {
        // Read the length which takes 4 bytes
        var lengthPrefix = buffer.readUInt32BE(startIndex);
        startIndex += 4;
        // Read the Bloom filter content
        var filterContent = buffer.subarray(startIndex, startIndex + lengthPrefix);
        startIndex += lengthPrefix;
        // Create a new bloom filter of size in bits and number of hash functions and store the filter content
        var currentFilter = new bloomfilter_sha256_1.BloomFilter(filterContent.length * 8, 1);
        // Buckets is of type Int32Array, so we have to convert the buffer back to Int32Array
        currentFilter.buckets = new Int32Array(filterContent.buffer, filterContent.byteOffset, filterContent.byteLength / Int32Array.BYTES_PER_ELEMENT);
        bloomFilters.push(currentFilter);
    }
    return [bloomFilters, salt];
}
