import { detailedDiff } from 'deep-object-diff'

export type CheckSDKMigrationArgs<T> = {
  legacy: T
  migrated?: T | Error
}

export const unwrapSDKData = async <P extends { data?: unknown }>(
  promise: Promise<P>
): Promise<P['data'] | undefined | Error> => {
  try {
    return (await promise).data
  } catch (e) {
    return e as Error
  }
}

export const compareSDKResponse = <T extends object>(
  { legacy, migrated }: CheckSDKMigrationArgs<T>,
  apiName: string
) => {
  if (migrated instanceof Error) {
    console.error(
      `DIFF ${apiName} FAILED. Migrated response was error: `,
      migrated
    )
  } else if (migrated == null) {
    console.error(
      `DIFF ${apiName} FAILED. Migrated response is empty (${migrated})`
    )
  } else {
    const diffValue =
      Array.isArray(legacy) && Array.isArray(migrated)
        ? legacy.map((l, idx) => detailedDiff(l, migrated[idx]))
        : detailedDiff(legacy, migrated)
    console.debug(`DIFF ${apiName}`, diffValue)
  }
}

const coerceToError = (e: any) => (e instanceof Error ? e : new Error(e))

/** This helper is used to shadow a migration without affecting the return value.
 * It will run two calls in parallel to fetch the legacy and migrated responses,
 * compare the results, log the diff, and then return the legacy value. Errors thrown
 * by the call for the migrated response will be caught to avoid bugs in the migrated
 * code from causing errors.
 */
export const checkSDKMigration = async <T extends object>({
  legacy: legacyCall,
  migrated: migratedCall,
  endpointName
}: {
  legacy: Promise<T> | (() => Promise<T>)
  migrated: Promise<T> | (() => Promise<T>)
  endpointName: string
}) => {
  // TODO: Add feature flagging for running the shadow
  const [legacyResult, migratedResult] = await Promise.allSettled([
    typeof legacyCall === 'function' ? legacyCall() : legacyCall,
    typeof migratedCall === 'function' ? migratedCall() : migratedCall
  ])
  // Preserve existing behavior of legacy call throwing on failure
  if (legacyResult.status === 'rejected') {
    throw legacyResult.reason
  }

  const legacy = legacyResult.value
  const migrated =
    migratedResult.status === 'rejected'
      ? coerceToError(migratedResult.reason)
      : migratedResult.value

  compareSDKResponse({ legacy, migrated }, endpointName)

  return legacy
}
