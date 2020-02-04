/** Wrapper class for all e2e tests */
import * as testContract from './testContract.js'
import * as testPlaylist from './testPlaylist'
import * as testTrack from './testTrack'
import * as testUser from './testUser'

let fns = {}
Object.assign(fns, testContract, testPlaylist, testTrack, testUser)

module.exports = fns
