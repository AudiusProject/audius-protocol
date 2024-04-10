import { detailedDiff } from 'deep-object-diff'

export type ShadowAndCompareArgs<T> = {
  legacy: T
  migrated?: T | Error
  /** Only perform diff, do not return migrated response */
  useLegacy?: boolean
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
  { legacy, migrated }: ShadowAndCompareArgs<T>,
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

/** Accepts two promises or functions generating promises,
 * runs them in parallel, compares the results and returns them.
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

  return { legacy, migrated }
}
