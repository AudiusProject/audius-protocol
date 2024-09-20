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
import { MobileOS } from '@audius/common/models';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Notifications } from 'react-native-notifications';
import { PERMISSIONS, request } from 'react-native-permissions';
import { track, make } from 'app/services/analytics';
import { EventNames } from 'app/types/analytics';
import { DEVICE_TOKEN } from './constants/storage-keys';
// Set to true while the push notification service is registering with the os
var isRegistering = false;
// Singleton class
var PushNotifications = /** @class */ (function () {
    // onNotification is a function passed in that is to be called when a
    // notification is to be emitted.
    function PushNotifications() {
        var _this = this;
        this.setNavigation = function (navigation) {
            _this.navigation = navigation;
        };
        this.onNotification = function (notification) {
            var _a, _b, _c, _d;
            console.info("Received notification ".concat(JSON.stringify(notification)));
            var title = notification.title, body = notification.body, payload = notification.payload;
            track(make({
                eventName: EventNames.NOTIFICATIONS_OPEN_PUSH_NOTIFICATION,
                title: title,
                body: body
            }));
            (_a = _this.navigation) === null || _a === void 0 ? void 0 : _a.navigate((_d = (_c = (_b = payload === null || payload === void 0 ? void 0 : payload.data) === null || _b === void 0 ? void 0 : _b.data) !== null && _c !== void 0 ? _c : payload === null || payload === void 0 ? void 0 : payload.data) !== null && _d !== void 0 ? _d : payload);
        };
        // Method used to open the push notification that the user pressed while the app was closed
        this.openInitialNotification = function () { return __awaiter(_this, void 0, void 0, function () {
            var notification;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Notifications.getInitialNotification()];
                    case 1:
                        notification = _a.sent();
                        if (notification) {
                            this.onNotification(notification);
                        }
                        return [2 /*return*/];
                }
            });
        }); };
        this.configure();
        this.lastId = 0;
        this.token = null;
        this.navigation = null;
    }
    PushNotifications.prototype.onRegister = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = { token: event.deviceToken, os: Platform.OS };
                        this.token = token;
                        return [4 /*yield*/, AsyncStorage.setItem(DEVICE_TOKEN, JSON.stringify(token))];
                    case 1:
                        _a.sent();
                        isRegistering = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    PushNotifications.prototype.deregister = function () {
        AsyncStorage.removeItem(DEVICE_TOKEN);
    };
    PushNotifications.prototype.configure = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        Notifications.events().registerRemoteNotificationsRegistered(this.onRegister);
                        Notifications.events().registerNotificationOpened(this.onNotification);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, AsyncStorage.getItem(DEVICE_TOKEN)];
                    case 2:
                        token = _a.sent();
                        if (token) {
                            this.token = JSON.parse(token);
                        }
                        else {
                            console.info("Device token not found");
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        console.error("Device token read error");
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PushNotifications.prototype.hasPermission = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, Notifications.isRegisteredForRemoteNotifications()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    PushNotifications.prototype.requestPermission = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        isRegistering = true;
                        if (!(Platform.OS === MobileOS.ANDROID)) return [3 /*break*/, 2];
                        // For android, Notifications.registerRemoteNotifications is supposed to prompt user for permission but its currently not
                        return [4 /*yield*/, request(PERMISSIONS.ANDROID.POST_NOTIFICATIONS)];
                    case 1:
                        // For android, Notifications.registerRemoteNotifications is supposed to prompt user for permission but its currently not
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        Notifications.registerRemoteNotifications();
                        return [2 /*return*/];
                }
            });
        });
    };
    PushNotifications.prototype.cancelNotif = function () {
        Notifications.cancelLocalNotification(this.lastId);
    };
    PushNotifications.prototype.cancelAll = function () {
        Notifications.ios.cancelAllLocalNotifications();
    };
    PushNotifications.prototype.setBadgeCount = function (count) {
        Notifications.ios.setBadgeCount(count);
    };
    PushNotifications.prototype.getToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!isRegistering) return [3 /*break*/, 2];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 0];
                    case 2: return [4 /*yield*/, AsyncStorage.getItem(DEVICE_TOKEN)];
                    case 3:
                        token = _a.sent();
                        if (token) {
                            return [2 /*return*/, JSON.parse(token)];
                        }
                        return [2 /*return*/, {}];
                }
            });
        });
    };
    return PushNotifications;
}());
var notifications = new PushNotifications();
export default notifications;
