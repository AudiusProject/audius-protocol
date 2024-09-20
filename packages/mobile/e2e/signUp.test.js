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
import { dayjs } from '@audius/common/utils';
import { device, expect } from 'detox';
import { random } from 'lodash';
import { byRole, byText } from './matchers';
function generateTestUser() {
    var ts = dayjs().format('YYMMDD_HHmmss');
    var email = "prober+".concat(ts, "@audius.co");
    var password = 'Pa$$w0rdTest';
    var name = "Prober ".concat(ts);
    var handle = "p_".concat(ts);
    return {
        email: email,
        password: password,
        name: name,
        handle: handle
    };
}
function assertOnSignUp() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, expect(byRole('heading', { name: /sign up for audius/i })).toBeVisible()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
describe('Sign up', function () {
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, device.launchApp()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, device.reloadReactNative()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should open the sign up screen', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, assertOnSignUp()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('can navigate to sign-up from sign-in', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, assertOnSignUp()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, byRole('link', { name: /sign in/i }).tap()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, expect(byText(/new to audius?/i)).toBeVisible()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, byRole('link', { name: /sign up/i }).tap()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, assertOnSignUp()];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should create an account', function () { return __awaiter(void 0, void 0, void 0, function () {
        function selectRandomArtist() {
            return __awaiter(this, void 0, void 0, function () {
                var artistElements, randomArtist, numArtists;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, byRole('checkbox', {
                                name: /artist-.*/i
                            }).getAttributes()];
                        case 1:
                            artistElements = _a.sent();
                            if ('elements' in artistElements) {
                                numArtists = artistElements.elements.length;
                                randomArtist = byRole('checkbox', { name: /artist-.*/i }).atIndex(random(Math.min(numArtists - 1, 10)));
                            }
                            else {
                                randomArtist = byRole('checkbox', { name: /artist-.*/i });
                            }
                            return [4 /*yield*/, randomArtist.tap()];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        var testUser, email, password, handle, name, genres, _i, genres_1, genre, _a, genres_2, genre;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    testUser = generateTestUser();
                    email = testUser.email, password = testUser.password, handle = testUser.handle, name = testUser.name;
                    return [4 /*yield*/, byRole('textbox', { name: /email/i }).typeText(email)];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', { name: /sign up free/i }).tap()];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, expect(byRole('heading', { name: /create your password/i })).toBeVisible()];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, expect(byText(/create a password that's secure and easy to remember! .*/i)).toBeVisible()];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, expect(byText(/your email/i)).toBeVisible()];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, expect(byText(email)).toBeVisible()];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, byRole('textbox', { name: /^password/i }).typeText(password)];
                case 7:
                    _b.sent();
                    return [4 /*yield*/, byRole('textbox', { name: /confirm password/i }).typeText(password)];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', { name: /continue/i }).tap()];
                case 9:
                    _b.sent();
                    return [4 /*yield*/, expect(byRole('heading', { name: /pick your handle/i })).toBeVisible()];
                case 10:
                    _b.sent();
                    return [4 /*yield*/, expect(byText(/this is how others find and tag you. .*/i)).toBeVisible()];
                case 11:
                    _b.sent();
                    return [4 /*yield*/, byRole('textbox', { name: /handle/i }).typeText(handle)];
                case 12:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', { name: /continue/i }).tap()];
                case 13:
                    _b.sent();
                    return [4 /*yield*/, expect(byRole('heading', { name: /finish your profile/i })).toBeVisible()];
                case 14:
                    _b.sent();
                    return [4 /*yield*/, expect(byText(/your photos & display name is how others see you. .*/i)).toBeVisible()];
                case 15:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', {
                            name: /select cover photo/i,
                            labelOnly: true
                        }).tap()];
                case 16:
                    _b.sent();
                    return [4 /*yield*/, byText(/photo library/i).tap()];
                case 17:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', {
                            name: /select profile picture/i,
                            labelOnly: true
                        }).tap()];
                case 18:
                    _b.sent();
                    return [4 /*yield*/, byText(/photo library/i).tap()];
                case 19:
                    _b.sent();
                    return [4 /*yield*/, byRole('textbox', { name: /display name/i }).typeText(name)];
                case 20:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', { name: /continue/i }).tap()];
                case 21:
                    _b.sent();
                    return [4 /*yield*/, expect(byRole('heading', { name: /select your genres/i })).toBeVisible()];
                case 22:
                    _b.sent();
                    return [4 /*yield*/, expect(byText(/start by picking some of your favorite genres./i)).toBeVisible()];
                case 23:
                    _b.sent();
                    genres = [/^acoustic/i, /^pop/i, /^lo-fi/i, /^electronic/i];
                    _i = 0, genres_1 = genres;
                    _b.label = 24;
                case 24:
                    if (!(_i < genres_1.length)) return [3 /*break*/, 28];
                    genre = genres_1[_i];
                    return [4 /*yield*/, byRole('checkbox', { name: genre }).tap()];
                case 25:
                    _b.sent();
                    return [4 /*yield*/, expect(byRole('checkbox', { name: genre })).toHaveValue('checkbox, checked')];
                case 26:
                    _b.sent();
                    _b.label = 27;
                case 27:
                    _i++;
                    return [3 /*break*/, 24];
                case 28: return [4 /*yield*/, element(by.id('genreScrollView')).scrollTo('bottom')];
                case 29:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', { name: /continue/i }).tap()];
                case 30:
                    _b.sent();
                    return [4 /*yield*/, expect(byRole('heading', { name: /follow at least 3 artists/i })).toBeVisible()];
                case 31:
                    _b.sent();
                    return [4 /*yield*/, expect(byText(/curate your feed with tracks uploaded .*/i)).toBeVisible()];
                case 32:
                    _b.sent();
                    return [4 /*yield*/, expect(byRole('radio', { name: /featured/i })).toHaveValue('radio button, checked')];
                case 33:
                    _b.sent();
                    _a = 0, genres_2 = genres;
                    _b.label = 34;
                case 34:
                    if (!(_a < genres_2.length)) return [3 /*break*/, 37];
                    genre = genres_2[_a];
                    return [4 /*yield*/, expect(byRole('radio', { name: genre })).toBeVisible()];
                case 35:
                    _b.sent();
                    _b.label = 36;
                case 36:
                    _a++;
                    return [3 /*break*/, 34];
                case 37: return [4 /*yield*/, selectRandomArtist()];
                case 38:
                    _b.sent();
                    return [4 /*yield*/, byRole('radio', { name: /acoustic/i }).tap()];
                case 39:
                    _b.sent();
                    return [4 /*yield*/, selectRandomArtist()];
                case 40:
                    _b.sent();
                    return [4 /*yield*/, byRole('radio', { name: /electronic/i }).tap()];
                case 41:
                    _b.sent();
                    return [4 /*yield*/, selectRandomArtist()];
                case 42:
                    _b.sent();
                    return [4 /*yield*/, byRole('button', { name: /continue/i }).tap()];
                case 43:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
