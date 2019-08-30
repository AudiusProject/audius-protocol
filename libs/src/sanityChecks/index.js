const isCreator = require('./isCreator')

// Checks to run at startup to ensure a user is in a good state.
class SanityChecks {
  constructor (libsInstance) {
    this.libs = libsInstance
  }

  async run () {
    await Promise.all([
      isCreator(this.libs)
    ])
  }
}

module.exports = SanityChecks
