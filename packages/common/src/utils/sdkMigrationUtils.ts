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
export const compareSDKResponse = <T extends object>(
  { legacy, migrated }: CheckSDKMigrationArgs<T>,
  endpointName: string
) => {
  // Migrated is an error, skip the diff
  if (migrated instanceof Error) {
    throw new SDKMigrationFailedError({
      endpointName,
      innerMessage: 'Migrated response was error',
      legacyValue: legacy,
      migratedValue: migrated
    })
  }
  // Both object-like, perform deep diff
  if (typeof legacy === 'object' && typeof migrated === 'object') {
    const diff = detailedDiff(legacy, migrated)
    if (
      !isEmpty(diff.added) ||
      !isEmpty(diff.deleted) ||
      !isEmpty(diff.updated)
    ) {
      throw new SDKMigrationFailedError({
        diff,
        endpointName,
        innerMessage: 'Legacy and migrated values differ',
        legacyValue: legacy,
        migratedValue: migrated
      })
    }
  }
  // Not object like, perform strict equals
  else if (legacy !== migrated) {
    throw new SDKMigrationFailedError({
      endpointName,
      innerMessage: 'Legacy and migrated values not strictly equal',
      legacyValue: legacy,
      migratedValue: migrated
    })
  }
  console.debug(`SDK Migration succeeded for ${endpointName}`)
}

const safeAwait = async <T>(promiseOrFn: Promise<T> | (() => Promise<T>)) => {
  try {
    return await (typeof promiseOrFn === 'function'
      ? promiseOrFn()
      : promiseOrFn)
  } catch (e) {
    return e instanceof Error ? e : new Error(`${e}`)
  }
}

export type SDKMigrationChecker = <T extends object>(config: {
  legacy: Promise<T> | (() => Promise<T>)
  migrated: Promise<T> | (() => Promise<T>)
  endpointName: string
}) => Promise<T>

export const checkSDKMigration = async <T extends object>({
  legacy: legacyCall,
  migrated: migratedCall,
  endpointName
}: {
  legacy: Promise<T> | (() => Promise<T>)
  migrated: Promise<T> | (() => Promise<T>)
  endpointName: string
}) => {
  const legacyPromise =
    typeof legacyCall === 'function' ? legacyCall() : legacyCall

  const [legacy, migrated] = await Promise.all([
    legacyPromise,
    safeAwait(migratedCall)
  ])

  try {
    compareSDKResponse({ legacy, migrated }, endpointName)
  } catch (e) {
    const error =
      e instanceof SDKMigrationFailedError
        ? e
        : new SDKMigrationFailedError({
            endpointName,
            innerMessage: `Unknown error: ${e}`,
            legacyValue: legacy,
            migratedValue: migrated
          })
    console.warn('SDK Migration failed', error)
  }

  return legacy
}
