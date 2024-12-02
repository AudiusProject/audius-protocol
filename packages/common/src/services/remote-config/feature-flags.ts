import { Environment } from '../env'

/* FeatureFlags must be lowercase snake case */
export enum FeatureFlags {
  SURFACE_AUDIO_ENABLED = 'surface_audio_enabled',
  PREFER_HIGHER_PATCH_FOR_SECONDARIES = 'prefer_higher_patch_for_secondaries',
  DISABLE_SIGN_UP_CONFIRMATION = 'disable_sign_up_confirmation',
  NEW_ARTIST_DASHBOARD_TABLE = 'new_artist_dashboard_table',
  BUY_AUDIO_COINBASE_ENABLED = 'buy_audio_coinbase_enabled',
  BUY_AUDIO_STRIPE_ENABLED = 'buy_audio_stripe_enabled',
  VERIFY_HANDLE_WITH_TIKTOK = 'verify_handle_with_tiktok',
  VERIFY_HANDLE_WITH_TWITTER = 'verify_handle_with_twitter',
  VERIFY_HANDLE_WITH_INSTAGRAM = 'verify_handle_with_instagram',
  FAST_CACHE = 'fast_cache',
  SAFE_FAST_CACHE = 'safe_fast_cache',
  SIMPLE_CACHE = 'simple_cache',
  RELATED_ARTISTS_ON_PROFILE_ENABLED = 'related_artists_on_profile_enabled',
  PROXY_WORMHOLE = 'proxy_wormhole',
  USDC_PURCHASES = 'usdc_purchases',
  FEATURE_FLAG_ACCESS = 'feature_flag_access',
  BUY_USDC_VIA_SOL = 'buy_usdc_via_sol',
  IOS_USDC_PURCHASE_ENABLED = 'ios_usdc_purchase_enabled',
  BUY_WITH_COINFLOW = 'buy_with_coinflow',
  COINFLOW_OFFRAMP_ENABLED = 'coinflow_offramp_enabled',
  TIKTOK_NATIVE_AUTH = 'tiktok_native_auth',
  SDK_MIGRATION_SHADOWING = 'sdk_migration_shadowing',
  USE_ADDRESS_LOOKUPS = 'use_address_lookups',
  MANAGER_MODE = 'manager_mode',
  PAYOUT_WALLET_ENABLED = 'payout_wallet_enabled',
  EDITABLE_ACCESS_ENABLED = 'editable_access_enabled',
  PAY_WITH_ANYTHING_ENABLED = 'pay_with_anything_enabled',
  COMMENTS_ENABLED = 'comments_enabled',
  COMMENT_POSTING_ENABLED = 'comment_posting_enabled',
  PAID_SCHEDULED = 'paid_scheduled',
  ONE_TO_MANY_DMS = 'one_to_many_dms',
  NETWORK_CUT_ENABLED = 'network_cut_enabled',
  SOCIAL_SIGNUP = 'social_signup',
  RIGHTS_AND_COVERS = 'rights_and_covers',
  GUEST_CHECKOUT = 'guest_checkout',
  TRACK_AUDIO_REPLACE = 'track_audio_replace',
  THEME_V2 = 'theme_v2'
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
  [FeatureFlags.SURFACE_AUDIO_ENABLED]: false,
  [FeatureFlags.PREFER_HIGHER_PATCH_FOR_SECONDARIES]: true,
  [FeatureFlags.DISABLE_SIGN_UP_CONFIRMATION]: false,
  [FeatureFlags.NEW_ARTIST_DASHBOARD_TABLE]: false,
  [FeatureFlags.BUY_AUDIO_COINBASE_ENABLED]: false,
  [FeatureFlags.BUY_AUDIO_STRIPE_ENABLED]: false,
  [FeatureFlags.VERIFY_HANDLE_WITH_TIKTOK]: false,
  [FeatureFlags.VERIFY_HANDLE_WITH_TWITTER]: false,
  [FeatureFlags.VERIFY_HANDLE_WITH_INSTAGRAM]: false,
  [FeatureFlags.FAST_CACHE]: false,
  [FeatureFlags.SAFE_FAST_CACHE]: false,
  [FeatureFlags.SIMPLE_CACHE]: false,
  [FeatureFlags.RELATED_ARTISTS_ON_PROFILE_ENABLED]: false,
  [FeatureFlags.PROXY_WORMHOLE]: false,
  [FeatureFlags.USDC_PURCHASES]: false,
  [FeatureFlags.FEATURE_FLAG_ACCESS]: false,
  [FeatureFlags.BUY_USDC_VIA_SOL]: false,
  [FeatureFlags.IOS_USDC_PURCHASE_ENABLED]: true,
  [FeatureFlags.BUY_WITH_COINFLOW]: false,
  [FeatureFlags.COINFLOW_OFFRAMP_ENABLED]: false,
  [FeatureFlags.TIKTOK_NATIVE_AUTH]: true,
  [FeatureFlags.SDK_MIGRATION_SHADOWING]: false,
  [FeatureFlags.USE_ADDRESS_LOOKUPS]: false,
  [FeatureFlags.MANAGER_MODE]: false,
  [FeatureFlags.PAYOUT_WALLET_ENABLED]: false,
  [FeatureFlags.EDITABLE_ACCESS_ENABLED]: false,
  [FeatureFlags.PAID_SCHEDULED]: false,
  [FeatureFlags.PAY_WITH_ANYTHING_ENABLED]: false,
  [FeatureFlags.COMMENTS_ENABLED]: false,
  [FeatureFlags.COMMENT_POSTING_ENABLED]: false,
  [FeatureFlags.GUEST_CHECKOUT]: false,
  [FeatureFlags.ONE_TO_MANY_DMS]: false,
  [FeatureFlags.NETWORK_CUT_ENABLED]: false,
  [FeatureFlags.SOCIAL_SIGNUP]: false,
  [FeatureFlags.RIGHTS_AND_COVERS]: false,
  [FeatureFlags.TRACK_AUDIO_REPLACE]: false,
  [FeatureFlags.THEME_V2]: false
}
