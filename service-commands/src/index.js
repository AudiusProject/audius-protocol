const {
  runSetupCommand,
  performHealthCheck,
  allUp,
  Service,
  SetupCommand
} = require('./setup')

const { LibsWrapper, Utils } = require('./libs')

// TODO: should make all of these imports dynamic!!!
const {
  addUser,
  upgradeToCreator,
  autoSelectCreatorNodes,
  setCreatorNodeEndpoint,
  updateCreator,
  getUser,
  getUserAccount,
  getLibsWalletAddress,
  setCurrentUser,
  getLibsUserInfo,
  updateMultihash,
  updateCoverPhoto,
  updateProfilePhoto
} = require('./commands/users')
const {
  uploadTrack,
  getTrackMetadata,
  addTrackToChain,
  updateTrackOnChain
} = require('./commands/tracks')
const { verifyCIDExistsOnCreatorNode } = require('./commands/files')
const { addIPLDToBlacklist } = require('./commands/ipldBlacklist')
const {
  createPlaylist,
  updatePlaylistCoverPhoto,
  getPlaylists
} = require('./commands/playlists')

module.exports = {
  runSetupCommand,
  performHealthCheck,
  LibsWrapper,
  Utils,
  addUser,
  upgradeToCreator,
  autoSelectCreatorNodes,
  setCreatorNodeEndpoint,
  updateCreator,
  uploadTrack,
  getTrackMetadata,
  getUser,
  getUserAccount,
  getLibsWalletAddress,
  setCurrentUser,
  getLibsUserInfo,
  updateMultihash,
  updateCoverPhoto,
  updateProfilePhoto,
  addIPLDToBlacklist,
  addTrackToChain,
  updateTrackOnChain,
  verifyCIDExistsOnCreatorNode,
  createPlaylist,
  updatePlaylistCoverPhoto,
  getPlaylists,
  allUp,
  Service,
  SetupCommand
}
