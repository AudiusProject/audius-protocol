// These Audius handles represent a list of accounts that are in a
// messed up state (they were able to change their handle) but oauth
// with twitter, which ends up forcing them to show the wrong twitter
// link on their profile.
export const verifiedHandleWhitelist = new Set([
  'miquela',
  'JodyBreeze',
  'masego'
])
