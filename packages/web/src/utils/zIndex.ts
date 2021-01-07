/**
 * Standardize the use of zIndex across the application
 *
 * NOTE: default modal zIndex is 10,000 and the modal bg is 9,999
 */

export enum zIndex {
  // Set to 1000 to account for nested modals inside, which take a higher z-index
  EDIT_TRACK_MODAL = 1000,
  EDIT_PLAYLIST_MODAL = 1000
}

export default zIndex
