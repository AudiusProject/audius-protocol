import { FeatureFlags } from '@audius/common/services'

import { useFlag } from './useRemoteConfig'

export const useIsAudioMatchingChallengesEnabled = () =>
  useFlag(FeatureFlags.AUDIO_MATCHING_CHALLENGES).isEnabled
