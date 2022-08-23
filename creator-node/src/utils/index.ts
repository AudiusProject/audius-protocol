import type { ReplicaSet } from './strToReplicaSet'
import strToReplicaSet from './strToReplicaSet'
const validateMetadata = require('./validateAudiusUserMetadata')
const { validateAssociatedWallets } = validateMetadata

module.exports = {
  strToReplicaSet,
  validateMetadata,
  validateAssociatedWallets
}

export type { ReplicaSet }
