const isCreator = require('./isCreator')
const syncNodes = require('./syncNodes')
const rolloverNodes = require('./rolloverNodes')

// Checks to run at startup to ensure a user is in a good state.
class SanityChecks {
  constructor (libsInstance) {
    this.libs = libsInstance
  }

  async run () {
    await isCreator(this.libs)
    await syncNodes(this.libs)
    await rolloverNodes(this.libs)
  }
}

module.exports = SanityChecks
