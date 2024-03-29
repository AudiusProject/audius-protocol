import { detailedDiff } from 'deep-object-diff'

export type ShadowAndCompareArgs<LegacyType, MigratedType> = {
  legacy: LegacyType
  migrated?: MigratedType | Error
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

export const compareSDKResponse = <
  LegacyType extends object,
  MigratedType extends object
>(
  { legacy, migrated }: ShadowAndCompareArgs<LegacyType, MigratedType>,
  apiName: string
): LegacyType => {
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

  return legacy
}
