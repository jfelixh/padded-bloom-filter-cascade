"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandom256BitString = generateRandom256BitString;
exports.convertSetToBinary = convertSetToBinary;
exports.drawNFromSet = drawNFromSet;
exports.binaryStringToBuffer = binaryStringToBuffer;
var crypto_1 = require("crypto");
var hex_to_bin_1 = require("hex-to-bin");
function generateRandom256BitString() {
    var bytes = (0, crypto_1.randomBytes)(32);
    return Array.from(bytes)
        .map(function (byte) { return byte.toString(2).padStart(8, "0"); })
        .join("");
}
// important: numbers are to big and therefore we have not precise results. Use hex2Bin instead
function convertSetToBinary(set) {
    var resultSet = new Set();
    set.forEach(function (id) {
        resultSet.add((0, hex_to_bin_1.default)(id));
    });
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
function binaryStringToBuffer(binaryString) {
    var byteArray = [];
    // Add padding to binary string if necessary
    var paddedBinaryString = binaryString.padStart(Math.ceil(binaryString.length / 8) * 8, "0");
    // Convert every 8 bits into a byte (number)
    for (var i = 0; i < paddedBinaryString.length; i += 8) {
        var byte = paddedBinaryString.slice(i, i + 8);
        byteArray.push(parseInt(byte, 2));
    }
    return Buffer.from(byteArray);
}
