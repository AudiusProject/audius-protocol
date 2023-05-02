import type { AudiusLibs } from '../AudiusLibs'

export const assignReplicaSetIfNecessary = async (
  libs: AudiusLibs,
  writeMetadataThroughChain = false
) => {
  try {
    await libs.User?.assignReplicaSetIfNecessary(writeMetadataThroughChain)
  } catch (e) {
    // If sanity check fails, do not block main thread and log error
    console.error((e as Error).message)
  }
}
