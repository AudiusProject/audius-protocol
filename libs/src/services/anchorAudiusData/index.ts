import * as AudiusData from '../../../../solana-programs/anchor/audius-data/dist/index'
import type { AudiusData as AudiusDataProgram } from '../../../../solana-programs/anchor/audius-data/target/types/audius_data'
import { Program, workspace } from '@project-serum/anchor'
import type SolanaWeb3Manager from '../solanaWeb3Manager'
import type { PublicKey } from '@solana/web3.js'

type AnchorAudiusDataConfig = {}

/**
 * AnchorAudiusData acts as the interface to solana auidus data programs from a client.
 * It wraps methods to create transactions.
 */
class AnchorAudiusData {
  anchorAudiusDataConfig: AnchorAudiusDataConfig
  solanaWeb3Manager: SolanaWeb3Manager
  program: Program<AudiusDataProgram>
  adminPublicKey: PublicKey | undefined
  adminStoragePublicKey: PublicKey | undefined

  /**
   * @param {Object} anchorAudiusDataConfig
   *  the solana cluster RPC endpoint
   * @param {string} anchorAudiusDataConfig.mintAddress
   * @param {SolanaWeb3Manager} solanaWeb3Manager
   */
  constructor(
    anchorAudiusDataConfig: AnchorAudiusDataConfig,
    solanaWeb3Manager: SolanaWeb3Manager
  ) {
    this.anchorAudiusDataConfig = anchorAudiusDataConfig
    this.solanaWeb3Manager = solanaWeb3Manager
    this.program = workspace.AudiusData as Program<AudiusDataProgram>
  }

  async init() {
    const { ...stuff } = this.anchorAudiusDataConfig
    console.log({ ...stuff })
  }

  // Setters
  setAdminPublicKey(adminPublicKey: PublicKey) {
    this.adminPublicKey = adminPublicKey
  }

  setAdminStoragePublicKey(adminStoragePublicKey: PublicKey) {
    this.adminStoragePublicKey = adminStoragePublicKey
  }

  /**
   * Creates a solana transaction for initAdmin
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  initAdmin(params: Omit<AudiusData.InitAdminParams, 'payer' | 'program'>) {
    // initAdmin = ({ payer, program, adminKeypair, adminStorageKeypair, verifierKeypair, })
    const tx = AudiusData.initAdmin({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
    return this.solanaWeb3Manager.transactionHandler.handleTransaction({
      instructions: tx.instructions,
      errorMapping: null,
      recentBlockhash: null,
      logger: console,
      sendBlockhash: true,
      signatures: null
    })
  }

  /**
   * Creates a solana transaction for initUser
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  initUser(params: Omit<AudiusData.InitUserParams, 'payer' | 'program'>) {
    // initUser = ({ payer, program, ethAddress, userId, bumpSeed, replicaSet, replicaSetBumps, metadata, userStorageAccount, baseAuthorityAccount, adminStorageAccount, adminAuthorityPublicKey, cn1, cn2, cn3, })
    const tx = AudiusData.initUser({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
  }

  /**
   * Creates a solana transaction for initUserSolPubkey
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  initUserSolPubkey(
    params: Omit<AudiusData.InitUserSolPubkeyParams, 'program'>
  ) {
    // initUserSolPubkey = ({ program, ethPrivateKey, message, userSolPubkey, userStorageAccount, })
    const tx = AudiusData.initUserSolPubkey({
      program: this.program,
      ...params
    })
  }

  /**
   * Creates a solana transaction for createContentNode
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  createContentNode(params: Omit<AudiusData.CreateContentNodeParams, 'payer' | 'program'>) {
    // createContentNode = ({ payer, program, adminStoragePublicKey, adminPublicKey, baseAuthorityAccount, spID, contentNodeAuthority, contentNodeAcct, ownerEthAddress, })
    const tx = AudiusData.createContentNode({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
  }

  /**
   * Creates a solana transaction for updateUserReplicaSet
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  updateUserReplicaSet(params: Omit<AudiusData.UpdateUserReplicaSetParams, 'payer' | 'program'>) {
    // updateUserReplicaSet = ({ payer, program, adminStoragePublicKey, baseAuthorityAccount, replicaSet, userAcct, replicaSetBumps, userIdSeedBump, contentNodeAuthorityPublicKey, cn1, cn2, cn3, })
    const tx = AudiusData.updateUserReplicaSet({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
  }

  /**
   * Creates a solana transaction for publicCreateOrUpdateContentNode
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  publicCreateOrUpdateContentNode(
    params: Omit<AudiusData.PublicCreateOrUpdateContentNodeParams, 'payer'| 'program'>
  ) {
    // publicCreateOrUpdateContentNode = ({ payer, program, adminStoragePublicKey, baseAuthorityAccount, spID, contentNodeAcct, ownerEthAddress, contentNodeAuthority, proposer1, proposer2, proposer3, })
    const tx = AudiusData.publicCreateOrUpdateContentNode({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
  }

  /**
   * Creates a solana transaction for publicDeleteContentNode
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  publicDeleteContentNode(
    params: Omit<AudiusData.PublicDeleteContentNodeParams, 'payer' | 'program'>
  ) {
    // publicDeleteContentNode = ({ payer, program, adminStoragePublicKey, adminAuthorityPublicKey, baseAuthorityAccount, cnDelete, proposer1, proposer2, proposer3, })
    const tx = AudiusData.publicDeleteContentNode({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
  }

  /**
   * Creates a solana transaction for createUser
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  createUser(params: Omit<AudiusData.CreateUserParams, 'program' | 'payer'>) {
    // createUser = ({ baseAuthorityAccount, program, ethAccount, message, replicaSet, replicaSetBumps, cn1, cn2, cn3, userId, bumpSeed, metadata, payer, userSolPubkey, userStorageAccount, adminStoragePublicKey, })
    const tx = AudiusData.createUser({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
  }

  /**
   * Creates a solana transaction for updateUser
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  updateUser(params: Omit<AudiusData.UpdateUserParams, 'payer' | 'program'>) {
    // updateUser = ({ program, metadata, userStorageAccount, userAuthorityPublicKey, userAuthorityDelegate, authorityDelegationStatusAccount, })
    const tx = AudiusData.updateUser({ 
      program: this.program,
      ...params })
  }
  program: this.program,

  /**
   * Creates a solana transaction for updateAdmin
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  updateAdmin(params: Omit<AudiusData.UpdateAdminParams, 'payer' | 'program'>) {
    // updateAdmin = ({ program, isWriteEnabled, adminStorageAccount, adminAuthorityKeypair, })
    const tx = AudiusData.updateAdmin({       program: this.program,
...params })
  }

  /**
   * Creates a solana transaction for initAuthorityDelegationStatus
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  initAuthorityDelegationStatus(
    params: Omit<AudiusData.InitAuthorityDelegationStatusParams, 'payer' | 'program'>
  ) {
    // initAuthorityDelegationStatus = ({ program, authorityName, userAuthorityDelegatePublicKey, authorityDelegationStatusPDA, payer, })
    const tx = AudiusData.initAuthorityDelegationStatus({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
  }

  /**
   * Creates a solana transaction for revokeAuthorityDelegation
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  revokeAuthorityDelegation(
    params: Omit<AudiusData.RevokeAuthorityDelegationParams, 'payer' | 'program'>
  ) {
    // revokeAuthorityDelegation = ({ program, authorityDelegationBump, userAuthorityDelegatePublicKey, authorityDelegationStatusPDA, payer, })
    const tx = AudiusData.revokeAuthorityDelegation({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
  }

  /**
   * Creates a solana transaction for addUserAuthorityDelegate
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  addUserAuthorityDelegate(
    params: Omit<AudiusData.AddUserAuthorityDelegateParams, 'payer' | 'program'>
  ) {
    // addUserAuthorityDelegate = ({ program, baseAuthorityAccount, delegatePublicKey, user, authorityDelegationStatus, currentUserAuthorityDelegate, userId, userBumpSeed, adminStoragePublicKey, signerUserAuthorityDelegate, authorityPublicKey, payer, })
    const tx = AudiusData.addUserAuthorityDelegate({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
  }

  /**
   * Creates a solana transaction for removeUserAuthorityDelegate
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  removeUserAuthorityDelegate(
    params: Omit<AudiusData.RemoveUserAuthorityDelegateParams, 'payer' | 'program'>
  ) {
    // removeUserAuthorityDelegate = ({ program, baseAuthorityAccount, delegatePublicKey, delegateBump, user, authorityDelegationStatus, currentUserAuthorityDelegate, userId, userBumpSeed, adminStoragePublicKey, signerUserAuthorityDelegate, authorityPublicKey, payer, })
    const tx = AudiusData.removeUserAuthorityDelegate({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
  }

  /**
   * Creates a solana transaction for updateIsVerified
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  updateIsVerified(params: Omit<AudiusData.updateIsVerified, 'program'>) {
    // updateIsVerified = ({ program, adminPublicKey, userStorageAccount, verifierPublicKey, baseAuthorityAccount, userId, bumpSeed, })
    const tx = AudiusData.updateIsVerified({       program: this.program,
 ..params })
  }
 
  /**
   * Creates a solana transaction for createTrack
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  createTrack(params: Omit<AudiusData.CreateEntityParams, 'program'>) {
    // createTrack = ({ id, program, baseAuthorityAccount, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userStorageAccountPDA, metadata, userId, adminStorageAccount, bumpSeed, })
    const tx = AudiusData.createTrack({       program: this.program,
...params })
  }
 
  /**
   * Creates a solana transaction for updateTrack
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  updateTrack(params: Omit<AudiusData.UpdateEntityParams, 'payer' | 'program'>) {
    // updateTrack = ({ program, baseAuthorityAccount, id, metadata, userAuthorityPublicKey, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userId, adminStorageAccount, bumpSeed, })
    const tx = AudiusData.updateTrack({       program: this.program,
...params })
  }
  program: this.program,

  /**
   * Creates a solana transaction for deleteTrack
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  deleteTrack(params: Omit<AudiusData.DeleteEntityParams, 'payer' | 'program'>) {
    // deleteTrack = ({ program, id, userStorageAccountPDA, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, baseAuthorityAccount, userId, adminStorageAccount, bumpSeed, })
    const tx = AudiusData.deleteTrack({       program: this.program,
...params })
  }

  /**
   * Creates a solana transaction for createPlaylist
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  createPlaylist(params: Omit<AudiusData.CreateEntityParams, 'program'>) {
    // createPlaylist = ({ id, program, baseAuthorityAccount, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userStorageAccountPDA, metadata, userId, adminStorageAccount, bumpSeed, })
    const tx = AudiusData.createPlaylist({       program: this.program,
...params })
  }

  /**
   * Creates a solana transaction for updatePlaylist
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  updatePlaylist(params: Omit<AudiusData.UpdateEntityParams, 'program'>) {
    // updatePlaylist = ({ id, program, baseAuthorityAccount, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userStorageAccountPDA, metadata, userId, adminStorageAccount, bumpSeed, })
    const tx = AudiusData.updatePlaylist({       program: this.program,
...params })
  }

  /**
   * Creates a solana transaction for deletePlaylist
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  deletePlaylist(params: Omit<AudiusData.DeleteEntityParams, 'payer' | 'program'>) {
    // deletePlaylist = ({ program, id, userStorageAccountPDA, userAuthorityPublicKey, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, baseAuthorityAccount, userId, adminStorageAccount, bumpSeed, })
    const tx = AudiusData.deletePlaylist({       program: this.program,
...params })
  }

  /**
   * Creates a solana transaction for addTrackSave
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  addTrackSave(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // addTrackSave = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.addTrackSave({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for deleteTrackSave
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  deleteTrackSave(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // deleteTrackSave = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.deleteTrackSave({ program: this.program,...params })
  }

  /**
   * Creates a solana transaction for addTrackRepost
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  addTrackRepost(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // addTrackRepost = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.addTrackRepost({ program: this.program, ...params })
  }
  

  /**
   * Creates a solana transaction for deleteTrackRepost
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  deleteTrackRepost(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // deleteTrackRepost = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.deleteTrackRepost({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for addPlaylistSave
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  addPlaylistSave(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // addPlaylistSave = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.addPlaylistSave({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for deletePlaylistSave
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  deletePlaylistSave(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // deletePlaylistSave = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.deletePlaylistSave({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for addPlaylistRepost
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  addPlaylistRepost(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // addPlaylistRepost = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.addPlaylistRepost({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for deletePlaylistRepost
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  deletePlaylistRepost(params: Omit<AudiusData.EntitySocialActionParams, 'program'>) {
    // deletePlaylistRepost = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.deletePlaylistRepost({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for followUser
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  followUser(params: Omit<AudiusData.UserSocialActionParams, 'program'>) {
    // followUser = ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }) => {, })
    const tx = AudiusData.followUser({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for unfollowUser
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  unfollowUser(params: Omit<AudiusData.UserSocialActionParams, 'program'>) {
    // unfollowUser = ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }) => {})
    const tx = AudiusData.unfollowUser({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for subscribeUser
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  subscribeUser(params: Omit<AudiusData.UserSocialActionParams, 'program'>) {
    // subscribeUser = ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }) => {)
    const tx = AudiusData.subscribeUser({ program: this.program, ...params })
  }

  /**
   * Creates a solana transaction for unsubscribeUser
   *
   * @param {{
   *  publicKey: PublicKey
   * }} { publicKey }
   * @return {Promise<number>}
   * @memberof SolanaWeb3Manager
   */
  unsubscribeUser(params: Omit<AudiusData.UserSocialActionParams, 'program'>) {
    // unsubscribeUser = ({ program, baseAuthorityAccount, sourceUserStorageAccountPDA, targetUserStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, sourceUserId, sourceUserBumpSeed, targetUserId, targetUserBumpSeed, adminStoragePublicKey, }) =>
    const tx = AudiusData.unsubscribeUser({ program: this.program, ...params })
  }
}

module.exports = AnchorAudiusData
