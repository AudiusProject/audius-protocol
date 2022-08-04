import {
  createUseFeatureFlagHook,
  createUseRemoteVarHook
} from '@audius/common'
import { getAccountUser } from 'audius-client/src/common/store/account/selectors'
import { isRemoteConfigLoaded } from 'audius-client/src/common/store/remote-config/selectors'
import { useSelector } from 'react-redux'

import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { remoteConfigInstance } from 'app/services/remote-config/remote-config-instance'

export const useFeatureFlag = createUseFeatureFlagHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelectorWeb(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})

export const useRemoteVar = createUseRemoteVarHook({
  remoteConfigInstance,
  useHasAccount: () => !!useSelectorWeb(getAccountUser),
  useHasConfigLoaded: () => !!useSelector(isRemoteConfigLoaded)
})
