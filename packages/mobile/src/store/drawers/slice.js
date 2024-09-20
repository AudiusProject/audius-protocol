import { createSlice } from '@reduxjs/toolkit';
var initialState = {
    EnablePushNotifications: false,
    DeactivateAccountConfirmation: false,
    ForgotPassword: false,
    NowPlaying: false,
    CancelEditTrack: false,
    DeleteTrackConfirmation: false,
    ConnectWallets: false,
    ConfirmRemoveWallet: false,
    ShareToStoryProgress: false,
    RemoveAllDownloads: false,
    RemoveDownloadedCollection: false,
    RemoveDownloadedFavorites: false,
    OfflineListening: false,
    UnfavoriteDownloadedCollection: false,
    RateCallToAction: false,
    LockedContent: false,
    ChatActions: false,
    CreateChatActions: false,
    ProfileActions: false,
    BlockMessages: false,
    DeleteChat: false,
    SupportersInfo: false,
    Welcome: false,
    ManagerMode: false,
    Comment: false,
    data: {}
};
var slice = createSlice({
    name: 'DRAWERS',
    initialState: initialState,
    reducers: {
        setVisibility: function (state, action) {
            var _a = action.payload, drawer = _a.drawer, visible = _a.visible, data = _a.data;
            state[drawer] = visible;
            if (visible && data) {
                state.data[drawer] = data;
            }
            else if (!visible) {
                state.data[drawer] = null;
            }
        }
    }
});
export var setVisibility = slice.actions.setVisibility;
export default slice.reducer;
