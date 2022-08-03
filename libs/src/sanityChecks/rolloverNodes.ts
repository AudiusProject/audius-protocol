import { Nullable, Utils } from '../utils'
import { CreatorNode } from '../services/creatorNode'
import type { AudiusLibs } from '../AudiusLibs'

const THREE_SECONDS = 3000
const MAX_TRIES = 3

/** Check if the user's primary creator node is healthy */
const checkPrimaryHealthy = async (
  libs: AudiusLibs,
  primary: string,
  tries: number
): Promise<boolean> => {
  const healthy = await Utils.isHealthy(primary)
  if (healthy) return healthy
  else {
    if (tries === 0) {
      return false
    }
    await Utils.wait(THREE_SECONDS)
    return await checkPrimaryHealthy(libs, primary, tries - 1)
  }
}

/** Gets new endpoints from a user's secondaries */
const getNewPrimary = async (libs: AudiusLibs, secondaries: string[]) => {
  for (const secondary of secondaries) {
    const syncStatus = await libs.creatorNode?.getSyncStatus(secondary)
    if (!syncStatus) continue
    if (!syncStatus.isBehind) {
      return secondary
    }
  }
  throw new Error(`Could not find valid secondaries for user ${secondaries}`)
}

export const rolloverNodes = async (
  libs: AudiusLibs,
  creatorNodeWhitelist: Nullable<Set<string>>
) => {
  console.debug('Sanity Check - rolloverNodes')
  const user = libs.userStateManager?.getCurrentUser()

  if (!user) return

  const primary = CreatorNode.getPrimary(user.creator_node_endpoint)
  if (!primary) return
  const healthy = await checkPrimaryHealthy(libs, primary, MAX_TRIES)
  if (healthy) return

  const secondaries = CreatorNode.getSecondaries(user.creator_node_endpoint)

  try {
    // Get a new primary
    const newPrimary = await getNewPrimary(libs, secondaries)
    const index = secondaries.indexOf(newPrimary)
    // Get new secondaries and backfill up to 2
    let newSecondaries = [...secondaries]
    newSecondaries.splice(index, 1)
    const autoselect = await libs.ServiceProvider?.autoSelectCreatorNodes({
      numberOfNodes: 2 - newSecondaries.length,
      whitelist: creatorNodeWhitelist,
      // Exclude ones we currently have
      blacklist: new Set([newPrimary, ...newSecondaries]),
      preferHigherPatchForPrimary: libs.User?.preferHigherPatchForPrimary,
      preferHigherPatchForSecondaries:
        libs.User?.preferHigherPatchForSecondaries
    })
    if (autoselect) {
      newSecondaries = newSecondaries.concat([
        autoselect.primary,
        ...autoselect.secondaries
      ])
    }

    // Set the new endpoint and connect to it
    const newEndpoints = [newPrimary, ...newSecondaries]
    await libs.creatorNode?.setEndpoint(newEndpoints[0]!)

    // Update the user
    const newMetadata = { ...user }
    newMetadata.creator_node_endpoint = newEndpoints.join(',')
    console.debug(
      `Sanity Check - rolloverNodes - new nodes ${newMetadata.creator_node_endpoint}`
    )
    await libs.User?.updateCreator(user.user_id, newMetadata)
  } catch (e) {
    console.error(e)
  }
}
