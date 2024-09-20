import { useMemo } from 'react';
import { AppContext } from '@audius/common/context';
import { useAsync } from 'react-use';
import * as analytics from 'app/services/analytics';
import { audiusBackendInstance } from 'app/services/audius-backend-instance';
import { localStorage } from 'app/services/local-storage';
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance';
import { getStorageNodeSelector } from 'app/services/sdk/storageNodeSelector';
import { generatePlaylistArtwork } from 'app/utils/generatePlaylistArtwork';
export var AppContextProvider = function (props) {
    var children = props.children;
    var storageNodeSelector = useAsync(getStorageNodeSelector).value;
    var value = useMemo(function () { return ({
        analytics: analytics,
        storageNodeSelector: storageNodeSelector,
        localStorage: localStorage,
        imageUtils: { generatePlaylistArtwork: generatePlaylistArtwork },
        audiusBackend: audiusBackendInstance,
        remoteConfig: remoteConfigInstance
    }); }, [storageNodeSelector]);
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
