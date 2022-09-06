import type { ReplicaSet } from './strToReplicaSet'
import { strToReplicaSet } from './strToReplicaSet'
import {
  timeout,
  getRandomInt,
  verifySignature,
  currentNodeShouldHandleTranscode,
  validateStateForImageDirCIDAndReturnFileUUID,
  findCIDInNetwork,
  getAllRegisteredCNodes,
  getIfAttemptedStateFix,
  createDirForFile,
  writeStreamToFileSystem,
  _streamFileToDiskHelper,
  runShellCommand,
  verifyCIDMatchesExpected,
  EMPTY_FILE_CID
} from './legacyUtils'
import {
  validateMetadata,
  validateAssociatedWallets
} from './validateAudiusUserMetadata'

export type { ReplicaSet }
export {
  timeout,
  getRandomInt,
  verifySignature,
  currentNodeShouldHandleTranscode,
  validateStateForImageDirCIDAndReturnFileUUID,
  findCIDInNetwork,
  getAllRegisteredCNodes,
  getIfAttemptedStateFix,
  createDirForFile,
  writeStreamToFileSystem,
  _streamFileToDiskHelper,
  runShellCommand,
  validateAssociatedWallets,
  validateMetadata,
  strToReplicaSet
}

module.exports = {
  timeout,
  getRandomInt,
  verifySignature,
  currentNodeShouldHandleTranscode,
  validateStateForImageDirCIDAndReturnFileUUID,
  findCIDInNetwork,
  getAllRegisteredCNodes,
  getIfAttemptedStateFix,
  createDirForFile,
  writeStreamToFileSystem,
  _streamFileToDiskHelper,
  runShellCommand,
  validateAssociatedWallets,
  validateMetadata,
  strToReplicaSet,
  verifyCIDMatchesExpected,
  EMPTY_FILE_CID
}
