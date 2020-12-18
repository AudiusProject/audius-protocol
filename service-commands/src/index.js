const Setup = require('./setup')

const { LibsWrapper, Utils } = require('./libs')

// Any method you add in these commands files will be dynamically imported
// and accessible via ServiceCommands
const User = require('./commands/users')
const Track = require('./commands/tracks')
const File = require('./commands/files')
const IpldBlacklist = require('./commands/ipldBlacklist')
const Playlist = require('./commands/playlists')

module.exports = {
  LibsWrapper,
  Utils,
  ...Setup,
  ...User,
  ...Track,
  ...File,
  ...IpldBlacklist,
  ...Playlist
}
