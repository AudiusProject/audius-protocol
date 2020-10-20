export enum IntKeys {
  /**
   * Duration (in ms) before we consider the fetch of an image against
   * a primary creator node a failure and try using libs.fetchCID
   */
  IMAGE_QUICK_FETCH_TIMEOUT_MS = 'IMAGE_QUICK_FETCH_TIMEOUT_MS',
  /**
   * The size at which a bundle of image loading performance metrics
   * are sent to the analytics sever
   */
  IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE = 'IMAGE_QUICK_FETCH_PERFORMANCE_BATCH_SIZE',

  /**
   * Duration (in ms) before we timeout a discovery provider that is
   * cached in the user's local storage
   */
  DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS = 'DISCOVERY_PROVIDER_SELECTION_TIMEOUT_MS',

  /**
   * Frequency (in ms) to poll for user wallet balance on the client dashboard page
   */
  DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS = 'DASHBOARD_WALLET_BALANCE_POLLING_FREQ_MS'
}

export enum BooleanKeys {
  /**
   * Notice that displays a "degraded functionality" banner across the app
   */
  NOTICE_DEGRADED_FUNCTIONALITY = 'NOTICE_DEGRADED_FUNCTIONALITY'
}

export enum DoubleKeys {}

export enum StringKeys {
  /**
   * Logo variant to display in the top left of the app.
   * `AUDIUS_LOGO_VARIANT_CLICK_TARGET` can be used to customize the
   * url that is navigated to on click.
   */
  AUDIUS_LOGO_VARIANT = 'AUDIUS_LOGO_VARIANT',

  /**
   * Click target for the top left Audius logo in the app.
   */
  AUDIUS_LOGO_VARIANT_CLICK_TARGET = 'AUDIUS_LOGO_VARIANT_CLICK_TARGET'
}

export type AllRemoteConfigKeys =
  | IntKeys
  | BooleanKeys
  | DoubleKeys
  | StringKeys
