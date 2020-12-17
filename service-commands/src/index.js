const Setup = require('./setup')

const { LibsWrapper, Utils } = require('./libs')

// Any method you add in these commands files will be dynamically imported
// and accessible via ServiceCommands
const Users = require('./commands/users')
const Tracks = require('./commands/tracks')
const Files = require('./commands/files')
const IpldBlacklist = require('./commands/ipldBlacklist')
const Playlists = require('./commands/playlists')

module.exports = {
  LibsWrapper,
  Utils,
  ...Setup,
  ...Users,
  ...Tracks,
  ...Files,
  ...IpldBlacklist,
  ...Playlists
}
