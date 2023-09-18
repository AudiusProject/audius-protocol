"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCount = void 0;
const numeral_1 = __importDefault(require("numeral"));
/**
 * The format for counting numbers should be 4 characters if possible (3 numbers and 1 Letter) without trailing 0
 * ie.
 * 375 => 375
 * 4,210 => 4.21K
 * 56,010 => 56K
 * 443,123 => 443K
 * 4,001,000 => 4M Followers
 */
const formatCount = (count) => {
    if (count >= 1000) {
        const countStr = count.toString();
        if (countStr.length % 3 === 0) {
            return (0, numeral_1.default)(count).format('0a').toUpperCase();
        }
        else if (countStr.length % 3 === 1 && countStr[2] !== '0') {
            return (0, numeral_1.default)(count).format('0.00a').toUpperCase();
        }
        else if (countStr.length % 3 === 1 && countStr[1] !== '0') {
            return (0, numeral_1.default)(count).format('0.0a').toUpperCase();
        }
        else if (countStr.length % 3 === 2 && countStr[2] !== '0') {
            return (0, numeral_1.default)(count).format('0.0a').toUpperCase();
        }
        else {
            return (0, numeral_1.default)(count).format('0a').toUpperCase();
        }
    }
    else if (!count) {
        return '0';
    }
    else {
        return `${count}`;
    }
};
exports.formatCount = formatCount;
