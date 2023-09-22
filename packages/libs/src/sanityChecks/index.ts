import type { AudiusLibs } from '../AudiusLibs'

import { needsRecoveryEmail } from './needsRecoveryEmail'

// Checks to run at startup to ensure a user is in a good state.
export class SanityChecks {
  libs: AudiusLibs

  constructor(libsInstance: AudiusLibs) {
    this.libs = libsInstance
  }

  /**
   * Runs sanity checks
   */
  async run() {
    await needsRecoveryEmail(this.libs)
  }
}
