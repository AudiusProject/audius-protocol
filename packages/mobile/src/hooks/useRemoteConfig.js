import { createUseFeatureFlagHook, createUseRemoteVarHook } from '@audius/common/hooks';
import { accountSelectors, remoteConfigSelectors } from '@audius/common/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance';
var isRemoteConfigLoaded = remoteConfigSelectors.isRemoteConfigLoaded;
var getAccountUser = accountSelectors.getAccountUser;
export var useFeatureFlag = createUseFeatureFlagHook({
    remoteConfigInstance: remoteConfigInstance,
    useHasAccount: function () { return !!useSelector(getAccountUser); },
    useHasConfigLoaded: function () { return !!useSelector(isRemoteConfigLoaded); },
    setLocalStorageItem: AsyncStorage.setItem,
    getLocalStorageItem: AsyncStorage.getItem
});
export var useRemoteVar = createUseRemoteVarHook({
    remoteConfigInstance: remoteConfigInstance,
    useHasAccount: function () { return !!useSelector(getAccountUser); },
    useHasConfigLoaded: function () { return !!useSelector(isRemoteConfigLoaded); }
});
