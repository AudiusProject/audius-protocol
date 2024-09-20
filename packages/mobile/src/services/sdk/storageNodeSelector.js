import { makeGetStorageNodeSelector } from '@audius/common/services';
import { env } from 'app/env';
import { auth } from './auth';
import { discoveryNodeSelectorService } from './discoveryNodeSelector';
export var getStorageNodeSelector = makeGetStorageNodeSelector({
    auth: auth,
    discoveryNodeSelectorService: discoveryNodeSelectorService,
    env: env
});
