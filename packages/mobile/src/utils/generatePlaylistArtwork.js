var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { uuid } from '@audius/common/utils';
import Jimp from 'jimp';
import ReactNativeBlobUtil from 'react-native-blob-util';
var _a = ReactNativeBlobUtil.fs, dirs = _a.dirs, writeFile = _a.writeFile;
var canvasWidth = 1000; // Adjust the width and height as per your requirements
var canvasHeight = 1000;
var imageWidth = canvasWidth / 2;
var imageHeight = canvasHeight / 2;
var mimeType = Jimp.MIME_JPEG;
export function generatePlaylistArtwork(imageUrls) {
    return __awaiter(this, void 0, void 0, function () {
        var images, newImage, i, image, x, y, fileName, url, imageContents, _a, base64Contents;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all(imageUrls.map(function (imageUrl) { return Jimp.read(imageUrl); }))];
                case 1:
                    images = _b.sent();
                    if (images.length === 1) {
                        newImage = images[0];
                    }
                    else {
                        newImage = new Jimp(canvasWidth, canvasHeight);
                        for (i = 0; i < 4; i++) {
                            image = images[i];
                            if (image) {
                                image.resize(imageWidth, imageHeight);
                                x = i % 2 === 0 ? 0 : imageWidth;
                                y = i < 2 ? 0 : imageHeight;
                                // Composite the image onto the canvas
                                newImage.composite(image, x, y);
                            }
                        }
                    }
                    fileName = uuid();
                    url = "".concat(dirs.CacheDir, "/").concat(fileName, ".jpg");
                    return [4 /*yield*/, newImage.getBase64Async(mimeType)];
                case 2:
                    imageContents = _b.sent();
                    _a = imageContents.split(','), base64Contents = _a[1];
                    return [4 /*yield*/, writeFile(url, base64Contents, 'base64')];
                case 3:
                    _b.sent();
                    return [2 /*return*/, {
                            url: url,
                            file: { uri: url, name: fileName, type: mimeType }
                        }];
            }
        });
    });
}
