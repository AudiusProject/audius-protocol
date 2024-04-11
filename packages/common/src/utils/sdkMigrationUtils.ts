import { detailedDiff } from 'deep-object-diff'
import { isEmpty } from 'lodash'
import { ErrorLevel, ReportToSentryArgs } from '~/models/ErrorReporting'
import { FeatureFlags, RemoteConfigInstance } from '~/services/remote-config'

export type CheckSDKMigrationArgs<T> = {
  legacy: T
  migrated?: T | Error
}

export class SDKMigrationFailedError extends Error {
  public endpointName: string
  public innerMessage: string
  public legacyValue: unknown
  public migratedValue: unknown

  constructor({
    endpointName,
    innerMessage,
    legacyValue,
    migratedValue
  }: {
    endpointName: string
    innerMessage: string
    legacyValue?: unknown
    migratedValue?: unknown
  }) {
    super(`Diff ${endpointName} failed: ${innerMessage}`)
    this.name = 'SDKMigrationFailedError'
    this.endpointName = endpointName
    this.innerMessage = innerMessage
    this.legacyValue = legacyValue
    this.migratedValue = migratedValue
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
  if (typeof legacy == 'object' && typeof migrated == 'object') {
    const diffValue = detailedDiff(legacy, migrated)
    if (
      !isEmpty(diffValue.added) ||
      !isEmpty(diffValue.deleted) ||
      !isEmpty(diffValue.updated)
    ) {
      throw new SDKMigrationFailedError({
        endpointName,
        innerMessage: 'Legacy and migrated values differ',
        legacyValue: legacy,
        migratedValue: migrated
      })
    }
  }
  // Not object like, perform strict equals
  if (legacy !== migrated) {
    throw new SDKMigrationFailedError({
      endpointName,
      innerMessage: 'Legacy and migrated values not strictly equal',
      legacyValue: legacy,
      migratedValue: migrated
    })
  }
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

export const createMigrationChecker = ({
  remoteConfigInstance,
  reportToSentry
}: {
  remoteConfigInstance: RemoteConfigInstance
  reportToSentry: (args: ReportToSentryArgs) => void
}): SDKMigrationChecker => {
  /** This helper is used to shadow a migration without affecting the return value.
   * It will run two calls in parallel to fetch the legacy and migrated responses,
   * compare the results, log the diff, and then return the legacy value. Errors thrown
   * by the call for the migrated response will be caught to avoid bugs in the migrated
   * code from causing errors.
   */
  const checkSDKMigration = async <T extends object>({
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
    if (
      !remoteConfigInstance.getFeatureEnabled(
        FeatureFlags.SDK_MIGRATION_SHADOWING
      )
    ) {
      return legacyPromise
    }

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
      reportToSentry({
        error,
        level: ErrorLevel.Warning,
        additionalInfo: {
          legacyValue: error.legacyValue,
          migratedValue: error.migratedValue
        },
        tags: { endpointName: error.endpointName }
      })
    }

    return legacy
  }

  return checkSDKMigration
}
