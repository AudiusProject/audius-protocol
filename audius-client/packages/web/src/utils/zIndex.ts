/**
 * Standardize the use of zIndex across the application
 *
 * NOTE: default modal zIndex is 10,000 and the modal bg is 9,999
 */

export enum zIndex {
  // These are still set in css, added here for reference
  // TODO: use these enums
  // FROSTED_HEADER_BACKGROUND = 10,
  // HEADER_CONTAINER = 13,
  // NAVIGATOR = 14,
  NAVIGATOR_POPUP = 15,
  NAVIGATOR_POPUP_OVERFLOW_POPUP = 16,
  FOLLOW_RECOMMENDATIONS_POPUP = 17,

  COLLECTIBLE_DETAILS_MODAL = 20,
  COLLECTIBLE_EMBED_VIEW_MODAL = 25,

  // Set to 1000 to account for nested modals inside, which take a higher z-index
  EDIT_TRACK_MODAL = 1000,
  CREATE_PLAYLIST_MODAL = 1000,
  IMAGE_SELECTION_POPUP = 1001,

  // Web3 wallet connect modal
  WEB3_WALLET_CONNECT_MODAL = 10001,

  // cognito flow modal
  COGNITO_FLOW_MODAL = 10001
}

export default zIndex
