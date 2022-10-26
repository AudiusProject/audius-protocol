import { addSecondaries } from './addSecondaries'
import { syncNodes } from './syncNodes'
import { needsRecoveryEmail } from './needsRecoveryEmail'
import { assignReplicaSetIfNecessary } from './assignReplicaSetIfNecessary'
import type { AudiusLibs } from '../AudiusLibs'

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
    await addSecondaries(this.libs)
    await assignReplicaSetIfNecessary(this.libs)
    await syncNodes(this.libs)
    await needsRecoveryEmail(this.libs)
  }
}
