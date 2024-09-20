import { DiscoveryNodeSelectorService } from '@audius/common/services';
import { env } from 'app/env';
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance';
export var discoveryNodeSelectorService = new DiscoveryNodeSelectorService({
    env: env,
    remoteConfigInstance: remoteConfigInstance
});
