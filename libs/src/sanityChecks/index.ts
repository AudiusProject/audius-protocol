import { sanitizeNodes } from './sanitizeNodes'
import { addSecondaries } from './addSecondaries'
import { syncNodes } from './syncNodes'
import { rolloverNodes } from './rolloverNodes'
import { needsRecoveryEmail } from './needsRecoveryEmail'
import { assignReplicaSetIfNecessary } from './assignReplicaSetIfNecessary'
import type { AudiusLibs } from '../AudiusLibs'
import type { Nullable } from '../utils'

// Checks to run at startup to ensure a user is in a good state.
export class SanityChecks {
  libs: AudiusLibs
  options: { skipRollover: boolean }

  constructor(libsInstance: AudiusLibs, options = { skipRollover: false }) {
    this.libs = libsInstance
    this.options = options
  }

  /**
   * Runs sanity checks
   */
  async run(creatorNodeWhitelist: Nullable<Set<string>> = null) {
    await sanitizeNodes(this.libs)
    await addSecondaries(this.libs)
    await assignReplicaSetIfNecessary(this.libs)
    await syncNodes(this.libs)
    if (!this.options.skipRollover) {
      await rolloverNodes(this.libs, creatorNodeWhitelist)
    }
    await needsRecoveryEmail(this.libs)
  }
}
