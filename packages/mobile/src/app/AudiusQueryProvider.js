import { AudiusQueryContext } from '@audius/common/audius-query';
import { env } from 'app/env';
import * as analytics from 'app/services/analytics';
import { apiClient } from 'app/services/audius-api-client';
import { audiusBackendInstance } from 'app/services/audius-backend-instance';
import { getFeatureEnabled, remoteConfigInstance } from 'app/services/remote-config';
import { audiusSdk } from 'app/services/sdk/audius-sdk';
import { store } from 'app/store';
import { reportToSentry } from 'app/utils/reportToSentry';
export var audiusQueryContext = {
    apiClient: apiClient,
    audiusBackend: audiusBackendInstance,
    audiusSdk: audiusSdk,
    dispatch: store.dispatch,
    reportToSentry: reportToSentry,
    env: env,
    fetch: fetch,
    remoteConfigInstance: remoteConfigInstance,
    getFeatureEnabled: getFeatureEnabled,
    analytics: analytics
};
export var AudiusQueryProvider = function (props) {
    var children = props.children;
    return (<AudiusQueryContext.Provider value={audiusQueryContext}>
      {children}
    </AudiusQueryContext.Provider>);
};
