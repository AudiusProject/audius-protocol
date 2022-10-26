import type { AudiusLibs } from '../AudiusLibs'
import { CreatorNode } from '../services/creatorNode'

/**
 * Syncs a creator node if its blocknubmer is behind the passed
 * in blocknumber.
 */
const syncNodeIfBehind = async (libs: AudiusLibs, endpoint: string) => {
  try {
    const syncStatus = await libs.creatorNode?.getSyncStatus(endpoint)
    if (!syncStatus) return
    const { isBehind, isConfigured } = syncStatus

    if (isBehind || !isConfigured) {
      console.debug(`Sanity Check - syncNodes - syncing ${endpoint}`)
      await libs.creatorNode?.syncSecondary(endpoint)
    }
  } catch (e) {
    console.error(e)
  }
}

export const syncNodes = async (libs: AudiusLibs) => {
  console.debug('Sanity Check - syncNodes')
  const user = libs.userStateManager?.getCurrentUser()

  if (!user) return

  const secondaries = CreatorNode.getSecondaries(user.creator_node_endpoint)
  await Promise.all(
    secondaries.map(
      async (secondary) => await syncNodeIfBehind(libs, secondary)
    )
  )
}
