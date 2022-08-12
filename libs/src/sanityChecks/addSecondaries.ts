import type { AudiusLibs } from '../AudiusLibs'
import { CreatorNode } from '../services/creatorNode'

/**
 * Add secondary creator nodes for a user if they don't have any
 * Goal: Make it so users always have a replica set
 */
export const addSecondaries = async (libs: AudiusLibs) => {
  console.debug('Sanity Check - addSecondaries')
  const user = libs.userStateManager?.getCurrentUser()

  if (!user) return

  const primary = CreatorNode.getPrimary(user.creator_node_endpoint)
  const secondaries = CreatorNode.getSecondaries(user.creator_node_endpoint)

  // Get current endpoints and check if we don't have enough secondaries
  if (secondaries.length < 2) {
    console.debug(
      `Sanity Check - addSecondaries - User has only ${secondaries.length}`
    )

    // Find new healthy secondaries
    const currentEndpoints = CreatorNode.getEndpoints(
      user.creator_node_endpoint
    )
    const services = await libs.ServiceProvider?.getSelectableCreatorNodes(
      /* whitelist */ null,
      /* blacklist */ new Set(currentEndpoints)
    )

    if (!services) {
      throw new Error('Sanity Check - addSecondaries - no services found')
    }

    console.debug(
      `Sanity Check - addSecondaries - found services ${JSON.stringify(
        services
      )}`
    )

    const newSecondaries = Object.keys(services).slice(
      0,
      2 - secondaries.length
    )

    // Combine primary, current secondaries, and new secondaries
    const newEndpoints = [primary, ...secondaries, ...newSecondaries]

    const newMetadata = { ...user }
    newMetadata.creator_node_endpoint = newEndpoints.join(',')
    console.debug(
      `Sanity Check - addSecondaries - new nodes ${newMetadata.creator_node_endpoint}`
    )
    await libs.User?.updateCreator(user.user_id, newMetadata)
  }
}
