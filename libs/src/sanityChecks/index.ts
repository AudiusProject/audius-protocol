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
  options: {
    skipRollover: boolean
    writeMetadataThroughChain: boolean
  }

  constructor(
    libsInstance: AudiusLibs,
    options = {
      skipRollover: false,
      writeMetadataThroughChain: false
    }
  ) {
    this.libs = libsInstance
    this.options = options
  }

  /**
   * Runs sanity checks
   */
  async run(
    creatorNodeWhitelist: Nullable<Set<string>> = null,
    creatorNodeBlacklist: Nullable<Set<string>> = null
  ) {
    await addSecondaries(this.libs, this.options.writeMetadataThroughChain)
    await assignReplicaSetIfNecessary(
      this.libs,
      this.options.writeMetadataThroughChain
    )
    await syncNodes(this.libs)
    if (!this.options.skipRollover) {
      await rolloverNodes(
        this.libs,
        creatorNodeWhitelist,
        creatorNodeBlacklist,
        this.options.writeMetadataThroughChain
      )
    }
    await needsRecoveryEmail(this.libs)
  }
}
