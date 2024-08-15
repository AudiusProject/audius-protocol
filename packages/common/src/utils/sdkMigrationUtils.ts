import { detailedDiff } from 'deep-object-diff'
import { isEmpty } from 'lodash'

export type CheckSDKMigrationArgs<T> = {
  legacy: T
  migrated?: T | Error
}

export class SDKMigrationFailedError extends Error {
  public endpointName: string
  public innerMessage: string
  public legacyValue: unknown
  public migratedValue: unknown
  public diff?: object

  constructor({
    endpointName,
    innerMessage,
    legacyValue,
    migratedValue,
    diff
  }: {
    endpointName: string
    innerMessage: string
    legacyValue?: unknown
    migratedValue?: unknown
    diff?: object
  }) {
    super(`Diff ${endpointName} failed: ${innerMessage}`)
    this.name = 'SDKMigrationFailedError'
    this.endpointName = endpointName
    this.innerMessage = innerMessage
    this.legacyValue = legacyValue
    this.migratedValue = migratedValue
    this.diff = diff
  }
}

/** Compares a legacy and migrated response, which must be the same shape. For
 * literal values, will do a strict equals. For objects, will do a deep diff.
 * Throws `SDKMigrationFailedError` if there is a difference between the two responses.
 */
export const compareSDKResponse = <T extends object | undefined | null>(
  { legacy, migrated }: CheckSDKMigrationArgs<T>,
  endpointName: string
) => {
  if (legacy == null || migrated == null) {
    if (legacy !== migrated) {
      console.error(`SDK Migration failed (empty) for ${endpointName}`, {
        legacy,
        migrated
      })
    } else {
      console.debug(`SDK Migration succeeded (empty) for ${endpointName}`)
    }
    return
  }
  // Migrated is an error, skip the diff
  if (migrated instanceof Error) {
    console.error(`SDK Migration failed (error) for ${endpointName}`, {
      legacy,
      migrated
    })
    return
  }
  // Both object-like, perform deep diff
  if (typeof legacy === 'object' && typeof migrated === 'object') {
    const diff = detailedDiff(legacy, migrated)
    if (
      !isEmpty(diff.added) ||
      !isEmpty(diff.deleted) ||
      !isEmpty(diff.updated)
    ) {
      console.error(`SDK Migration failed (diff) for ${endpointName}`, {
        diff,
        legacy,
        migrated
      })
    }
    console.debug(`SDK Migration succeeded (object diff) for ${endpointName}`)
    return
  }
  // Not object like, perform strict equals
  if (legacy !== migrated) {
    console.error(`SDK Migration failed (!==) for ${endpointName}`, {
      legacy,
      migrated
    })
    return
  }
  console.debug(`SDK Migration succeeded (===) for ${endpointName}`)
}
