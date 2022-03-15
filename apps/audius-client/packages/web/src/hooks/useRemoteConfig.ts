import { createUseFeatureFlagHook } from 'common/hooks/useFeatureFlag'
import { createUseRemoteVarHook } from 'common/hooks/useRemoteVar'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'

export const useFlag = createUseFeatureFlagHook(remoteConfigInstance)
export const useRemoteVar = createUseRemoteVarHook(remoteConfigInstance)
