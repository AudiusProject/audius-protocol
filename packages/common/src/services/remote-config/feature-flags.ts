import { Environment } from '../env'

/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  BUY_AUDIO_COINBASE_ENABLED = 'buy_audio_coinbase_enabled',
  BUY_AUDIO_STRIPE_ENABLED = 'buy_audio_stripe_enabled',
  VERIFY_HANDLE_WITH_TIKTOK = 'verify_handle_with_tiktok',
  VERIFY_HANDLE_WITH_TWITTER = 'verify_handle_with_twitter',
  VERIFY_HANDLE_WITH_INSTAGRAM = 'verify_handle_with_instagram',
  FAST_CACHE = 'fast_cache',
  SAFE_FAST_CACHE = 'safe_fast_cache',
  SIMPLE_CACHE = 'simple_cache',
  USDC_PURCHASES = 'usdc_purchases',
  FEATURE_FLAG_ACCESS = 'feature_flag_access',
  BUY_USDC_VIA_SOL = 'buy_usdc_via_sol',
  IOS_USDC_PURCHASE_ENABLED = 'ios_usdc_purchase_enabled',
  BUY_WITH_COINFLOW = 'buy_with_coinflow',
  COINFLOW_OFFRAMP_ENABLED = 'coinflow_offramp_enabled',
  TIKTOK_NATIVE_AUTH = 'tiktok_native_auth',
  COMMENTS_ENABLED = 'comments_enabled',
  COMMENT_POSTING_ENABLED = 'comment_posting_enabled',
  PAID_SCHEDULED = 'paid_scheduled',
  ONE_TO_MANY_DMS = 'one_to_many_dms',
  NETWORK_CUT_ENABLED = 'network_cut_enabled',
  SOCIAL_SIGNUP = 'social_signup',
  RIGHTS_AND_COVERS = 'rights_and_covers',
  GUEST_CHECKOUT = 'guest_checkout',
  TRACK_AUDIO_REPLACE = 'track_audio_replace',
  THEME_V2 = 'theme_v2',
  OWN_YOUR_FANS = 'own_your_fans'
}

type FlagDefaults = Record<FeatureFlags, boolean>

export const environmentFlagDefaults: Record<
  Environment,
  Partial<FlagDefaults>
> = {
  development: {},
  staging: {},
  production: {}
}

/**
 * If optimizely errors, these default values are used.
 */
export const flagDefaults: FlagDefaults = {
  [FeatureFlags.BUY_AUDIO_COINBASE_ENABLED]: false,
  [FeatureFlags.BUY_AUDIO_STRIPE_ENABLED]: false,
  [FeatureFlags.VERIFY_HANDLE_WITH_TIKTOK]: false,
  [FeatureFlags.VERIFY_HANDLE_WITH_TWITTER]: false,
  [FeatureFlags.VERIFY_HANDLE_WITH_INSTAGRAM]: false,
  [FeatureFlags.FAST_CACHE]: false,
  [FeatureFlags.SAFE_FAST_CACHE]: false,
  [FeatureFlags.SIMPLE_CACHE]: false,
  [FeatureFlags.USDC_PURCHASES]: false,
  [FeatureFlags.FEATURE_FLAG_ACCESS]: false,
  [FeatureFlags.BUY_USDC_VIA_SOL]: false,
  [FeatureFlags.IOS_USDC_PURCHASE_ENABLED]: true,
  [FeatureFlags.BUY_WITH_COINFLOW]: false,
  [FeatureFlags.COINFLOW_OFFRAMP_ENABLED]: false,
  [FeatureFlags.TIKTOK_NATIVE_AUTH]: true,
  [FeatureFlags.PAID_SCHEDULED]: false,
  [FeatureFlags.COMMENTS_ENABLED]: false,
  [FeatureFlags.COMMENT_POSTING_ENABLED]: false,
  [FeatureFlags.GUEST_CHECKOUT]: false,
  [FeatureFlags.ONE_TO_MANY_DMS]: false,
  [FeatureFlags.NETWORK_CUT_ENABLED]: false,
  [FeatureFlags.SOCIAL_SIGNUP]: false,
  [FeatureFlags.RIGHTS_AND_COVERS]: false,
  [FeatureFlags.TRACK_AUDIO_REPLACE]: false,
  [FeatureFlags.THEME_V2]: false,
  [FeatureFlags.OWN_YOUR_FANS]: false
}
