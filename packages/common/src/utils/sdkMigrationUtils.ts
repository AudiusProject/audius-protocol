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
