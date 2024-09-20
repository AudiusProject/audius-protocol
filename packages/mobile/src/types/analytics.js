var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { Name as CommonEventNames } from '@audius/common/models';
var MobileEventNames;
(function (MobileEventNames) {
    MobileEventNames["NOTIFICATIONS_OPEN_PUSH_NOTIFICATION"] = "Notifications: Open Push Notification";
    MobileEventNames["APP_ERROR"] = "App Unexpected Error";
    MobileEventNames["SHARE_TO_IG_STORY"] = "Share to Instagram story - start";
    MobileEventNames["SHARE_TO_IG_STORY_CANCELLED"] = "Share to Instagram story - cancelled";
    MobileEventNames["SHARE_TO_IG_STORY_ERROR"] = "Share to Instagram story - error";
    MobileEventNames["SHARE_TO_IG_STORY_SUCCESS"] = "Share to Instagram story - success";
    MobileEventNames["SHARE_TO_SNAPCHAT"] = "Share to Snapchat - start";
    MobileEventNames["SHARE_TO_SNAPCHAT_CANCELLED"] = "Share to Snapchat - cancelled";
    MobileEventNames["SHARE_TO_SNAPCHAT_ERROR"] = "Share to Snapchat - error";
    MobileEventNames["SHARE_TO_SNAPCHAT_STORY_SUCCESS"] = "Share to Snapchat - success";
    MobileEventNames["SHARE_TO_TIKTOK_VIDEO"] = "Share to TikTok (video) - start";
    MobileEventNames["SHARE_TO_TIKTOK_VIDEO_CANCELLED"] = "Share to TikTok (video) - cancelled";
    MobileEventNames["SHARE_TO_TIKTOK_VIDEO_ERROR"] = "Share to TikTok (video) - error";
    MobileEventNames["SHARE_TO_TIKTOK_VIDEO_SUCCESS"] = "Share to TikTok (video) - success";
    // Offline Mode
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_ALL_TOGGLE_ON"] = "Offline Mode: Download All Toggle On";
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_ALL_TOGGLE_OFF"] = "Offline Mode: Download All Toggle Off";
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_COLLECTION_TOGGLE_ON"] = "Offline Mode: Download Collection Toggle On";
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_COLLECTION_TOGGLE_OFF"] = "Offline Mode: Download Collection Toggle Off";
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_REQUEST"] = "Offline Mode: Download Item Request";
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_START"] = "Offline Mode: Download Item Start";
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_SUCCESS"] = "Offline Mode: Download Item Success";
    MobileEventNames["OFFLINE_MODE_DOWNLOAD_FAILURE"] = "Offline Mode: Download Item Failure";
    MobileEventNames["OFFLINE_MODE_REMOVE_ITEM"] = "Offline Mode: Remove Item";
    MobileEventNames["OFFLINE_MODE_PLAY"] = "Offline Mode: Offline Play";
    MobileEventNames["OFFLINE_MODE_FILEPATH_MIGRATION_STARTED"] = "Offline Mode: File path migration started";
    MobileEventNames["OFFLINE_MODE_FILEPATH_MIGRATION_SUCCESS"] = "Offline Mode: File path migration succeeded";
    MobileEventNames["OFFLINE_MODE_FILEPATH_MIGRATION_FAILURE"] = "Offline Mode: File path migration failed";
})(MobileEventNames || (MobileEventNames = {}));
export var EventNames = __assign(__assign({}, CommonEventNames), MobileEventNames);
export { PlaybackSource, ShareSource, RepostSource, FavoriteSource, FollowSource, CreatePlaylistSource } from '@audius/common/models';
