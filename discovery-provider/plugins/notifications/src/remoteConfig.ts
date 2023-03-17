import optimizelySDK, { Client } from '@optimizely/optimizely-sdk'

const optimizelySDKKey =
  process.env.OPTIMIZELY_SDK_KEY || 'MX4fYBgANQetvmBXGpuxzF'

export const MappingFeatureName = 'discovery_notification_mapping'
export enum MappingVariable {
  PushRepost = 'push_repost',
  PushSave = 'push_save',
  PushSaveOfRepost = 'push_save_of_repost',
  PushRepostOfRepost = 'push_repost_of_repost',
  PushRemix = 'push_remix',
  PushCosign = 'push_cosign',
  PushAddTrackToPlaylist = 'push_add_track_to_playlist',
  PushFollow = 'push_follow',
  PushMilestone = 'push_milestone',
  PushMilestoneFollowerCount = 'push_milestone_follower_count',
  PushSupporterRankUp = 'push_supporter_rank_up',
  PushSupportingRankUp = 'push_supporting_rank_up',
  PushSupporterDethroned = 'push_supporter_dethroned',
  PushTipRceive = 'push_tip_receive',
  PushTipSend = 'push_tip_send',
  PushChallengeReward = 'push_challenge_reward',
  PushTrackAddedToPlaylist = 'push_track_added_to_playlist',
  PushCreate = 'push_create',
  PushTrending = 'push_trending',
  PushAnnouncement = 'push_announcement',
  PushReaction = 'push_reaction'
}

const defaultMappingVariable = {
  [MappingVariable.PushRepost]: false,
  [MappingVariable.PushSave]: false,
  [MappingVariable.PushSaveOfRepost]: false,
  [MappingVariable.PushRepostOfRepost]: false,
  [MappingVariable.PushRemix]: false,
  [MappingVariable.PushCosign]: false,
  [MappingVariable.PushAddTrackToPlaylist]: false,
  [MappingVariable.PushFollow]: false,
  [MappingVariable.PushMilestone]: false,
  [MappingVariable.PushMilestoneFollowerCount]: false,
  [MappingVariable.PushSupporterRankUp]: false,
  [MappingVariable.PushSupportingRankUp]: false,
  [MappingVariable.PushSupporterDethroned]: false,
  [MappingVariable.PushTipRceive]: false,
  [MappingVariable.PushTipSend]: false,
  [MappingVariable.PushChallengeReward]: false,
  [MappingVariable.PushTrackAddedToPlaylist]: false,
  [MappingVariable.PushCreate]: false,
  [MappingVariable.PushTrending]: false,
  [MappingVariable.PushAnnouncement]: false,
  [MappingVariable.PushReaction]: false
}

export class RemoteConfig {
  optimizelyClient: Client
  isInit: boolean

  constructor() {
    this.optimizelyClient = optimizelySDK.createInstance({
      sdkKey: optimizelySDKKey,
      datafileOptions: {
        autoUpdate: true,
        updateInterval: 5000 // Poll for updates every 5s
      }
    })
    this.isInit = false
  }

  init = async () => {
    const optimizelyPromise = new Promise((resolve) => {
      this.optimizelyClient.onReady().then(() => {
        this.isInit = true
        resolve(true)
      })
    })
    await optimizelyPromise
  }

  getFeatureVariableEnabled(featureName: string, variable: string): boolean {
    const optimizelyValue = this.optimizelyClient.getFeatureVariableBoolean(
      featureName,
      variable,
      ''
    )
    // In case not set in optimizely, set to default
    if (optimizelyValue === null) {
      if (featureName == MappingFeatureName) {
        return defaultMappingVariable[variable]
      }
    }
    return optimizelyValue
  }
}
