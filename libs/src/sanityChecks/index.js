const isCreator = require('./isCreator')
const sanitizeNodes = require('./sanitizeNodes')
const addSecondaries = require('./addSecondaries')
const syncNodes = require('./syncNodes')
const rolloverNodes = require('./rolloverNodes')
const recoveryEmail = require('./needsRecoveryEmail')
const assignReplicaSetIfNecessary = require('./assignReplicaSetIfNecessary')

// Checks to run at startup to ensure a user is in a good state.
class SanityChecks {
  constructor (libsInstance, options = { skipRollover: false }) {
    this.libs = libsInstance
    this.options = options
  }

  /**
   * Runs sanity checks
   * @param {Set<string>} creatorNodeWhitelist
   * @param {boolean | null} [writeQuorumEnabled] true if metadata should be replicated to a secondary before returning a success response (default to null to allow Content Node to decide)
   */
  async run (creatorNodeWhitelist = null, writeQuorumEnabled = null) {
    await isCreator(this.libs)
    await sanitizeNodes(this.libs)
    await addSecondaries(this.libs)
    await assignReplicaSetIfNecessary(this.libs, writeQuorumEnabled)
    await syncNodes(this.libs)
    if (!this.options.skipRollover) await rolloverNodes(this.libs, creatorNodeWhitelist)
    await recoveryEmail(this.libs)
  }
}

module.exports = SanityChecks
