import type { AudiusLibs } from '../AudiusLibs'

/**
 * Sanitize user.creator_node_endpoint
 * Goal: Make it so we never end up in a state like creator_node_endpoint = "https://cn1.co,,"
 */
export const sanitizeNodes = async (libs: AudiusLibs) => {
  console.debug('Sanity Check - sanitizeNodes')
  const user = libs.userStateManager?.getCurrentUser()

  if (!user) return

  const sanitizedEndpoint = user.creator_node_endpoint
    .split(',')
    .filter(Boolean)
    .join(',')

  if (sanitizedEndpoint !== user.creator_node_endpoint) {
    console.debug(
      `Sanity Check - sanitizingNodes - ${user.creator_node_endpoint} -> ${sanitizedEndpoint}`
    )
    const newMetadata = { ...user }
    newMetadata.creator_node_endpoint = sanitizedEndpoint
    await libs.User?.updateCreator(user.user_id, newMetadata)
  }
}
