import { Nullable, Utils } from '../utils'
import { CreatorNode } from '../services/creatorNode'
import type { AudiusLibs } from '../AudiusLibs'
import maxBy from 'lodash/maxBy'

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
const getNewPrimary = async (secondaries: string[], wallet: string) => {
  const secondaryStatuses = (
    await Promise.all(
      secondaries.map(async (secondary) => {
        try {
          const clockValue = await CreatorNode.getClockValue(secondary, wallet)
          if (clockValue) return { secondary, clockValue }
          return undefined
        } catch (e) {
          console.warn(e)
          return undefined
        }
      })
    )
  ).filter(Boolean)
  const max = maxBy(secondaryStatuses, (s) => s?.clockValue)?.secondary
  if (!max) {
    throw new Error(`Could not find valid secondaries for user ${secondaries}`)
  }
  return max
}

export const rolloverNodes = async (
  libs: AudiusLibs,
  creatorNodeWhitelist: Nullable<Set<string>>,
  creatorNodeBlacklist: Nullable<Set<string>>
) => {
  console.debug('Sanity Check - rolloverNodes')
  const user = libs.userStateManager?.getCurrentUser()

  if (!user || user.is_storage_v2) return

  const primary = CreatorNode.getPrimary(user.creator_node_endpoint)
  if (!primary) return

  const healthy = await checkPrimaryHealthy(libs, primary, MAX_TRIES)
  if (healthy && !creatorNodeBlacklist?.has(primary)) return

  const secondaries = CreatorNode.getSecondaries(user.creator_node_endpoint)

  try {
    // Get a new primary
    const newPrimary = await getNewPrimary(secondaries, user.wallet!)
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
