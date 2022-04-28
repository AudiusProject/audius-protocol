import * as AudiusData from '@audius/anchor-audius-data'
import type { AudiusDataProgram } from '@audius/anchor-audius-data'
import anchor, { BN, Idl } from '@project-serum/anchor'
import type SolanaWeb3Manager from '../solanaWeb3Manager'
import type Web3Manager from '../web3Manager'
import { PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import SolanaUtils from '../solanaWeb3Manager/utils'
import { audiusDataErrorMapping } from './errors'

type AnchorAudiusDataConfig = {
  programId: string
  adminPublicKey: string
  adminStoragePublicKey: string
}

type OmitAndRequire<T, K extends keyof T, L extends keyof T> = Partial<
  Omit<T, K>
> &
  Required<Pick<T, L>>

/**
 * AnchorAudiusData acts as the interface to solana auidus data programs from a client.
 * It wraps methods to create transactions.
 */
export class AnchorAudiusData {
  anchorAudiusDataConfig: AnchorAudiusDataConfig
  solanaWeb3Manager: SolanaWeb3Manager
  program!: AudiusDataProgram
  programId!: PublicKey
  adminPublicKey!: PublicKey
  adminStoragePublicKey!: PublicKey
  provider!: anchor.Provider
  web3Manager: Web3Manager
  AudiusData: any

  /**
   * @param {Object} anchorAudiusDataConfig
   *  the solana cluster RPC endpoint
   * @param {string} anchorAudiusDataConfig.mintAddress
   * @param {SolanaWeb3Manager} solanaWeb3Manager
   * @param {Web3Manager} web3Manager
   */
  constructor(
    anchorAudiusDataConfig: AnchorAudiusDataConfig,
    solanaWeb3Manager: SolanaWeb3Manager,
    web3Manager: Web3Manager
  ) {
    this.anchorAudiusDataConfig = anchorAudiusDataConfig
    this.solanaWeb3Manager = solanaWeb3Manager
    this.web3Manager = web3Manager
    this.AudiusData = AudiusData
  }

  didInit() {
    return Boolean(
      this.programId &&
        this.adminPublicKey &&
        this.adminStoragePublicKey &&
        this.solanaWeb3Manager.feePayerKey &&
        this.program
    )
  }

  async init() {
    const { programId, adminPublicKey, adminStoragePublicKey } =
      this.anchorAudiusDataConfig
    this.programId = SolanaUtils.newPublicKeyNullable(programId)
    this.adminPublicKey = SolanaUtils.newPublicKeyNullable(adminPublicKey)
    this.adminStoragePublicKey = SolanaUtils.newPublicKeyNullable(
      adminStoragePublicKey
    )
    this.provider = new anchor.AnchorProvider(
      this.solanaWeb3Manager.connection,
      // NOTE: Method requests type wallet, but because signtransaction is not used, keypair is fine
      Keypair.generate() as any,
      anchor.AnchorProvider.defaultOptions()
    )
    this.program = new anchor.Program(
      AudiusData.idl as Idl,
      this.programId,
      this.provider
    ) as any
  }

  // Setters
  setAdminPublicKey(adminPublicKey: PublicKey) {
    this.adminPublicKey = adminPublicKey
  }

  setAdminStoragePublicKey(adminStoragePublicKey: PublicKey) {
    this.adminStoragePublicKey = adminStoragePublicKey
  }

  async getUserIdSeed(userId: BN) {
    if (!this.programId || !this.adminStoragePublicKey) return {}
    const userIdSeed = userId.toArrayLike(Uint8Array, 'le', 4)
    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: userAccount
    } = await this.solanaWeb3Manager.findDerivedPair(
      this.programId,
      this.adminStoragePublicKey,
      userIdSeed
    )
    return {
      userId,
      userIdSeed,
      userAccount,
      bumpSeed,
      baseAuthorityAccount
    }
  }

  getUserKeyPair(): anchor.web3.Keypair {
    return anchor.web3.Keypair.fromSeed(
      this.web3Manager.ownerWallet.getPrivateKey()
    )
  }

  async getContentNodeSeedAddress(spId: number) {
    const enc = new TextEncoder() // always utf-8
    const baseSpIdSeed = enc.encode('sp_id')
    const spIdValue = new anchor.BN(spId).toArray('le', 2)
    const { bumpSeed, derivedAddress } =
      await this.solanaWeb3Manager.findDerivedPair(
        this.programId,
        this.adminStoragePublicKey,
        new Uint8Array([...baseSpIdSeed, ...spIdValue])
      )
    return {
      bumpSeed,
      derivedAddress
    }
  }

  async signTransaction(
    tx: anchor.web3.Transaction,
    userKeyPair: anchor.web3.Keypair
  ) {
    const latestBlockHash =
      await this.solanaWeb3Manager.connection.getLatestBlockhash('confirmed')

    tx.recentBlockhash = latestBlockHash.blockhash
    tx.feePayer = this.solanaWeb3Manager.feePayerKey

    tx.partialSign(userKeyPair)
    return tx
  }

  async sendTx(tx: Transaction) {
    const signatures = tx.signatures
      .filter((s) => s.signature && s.publicKey)
      .map((s: any) => ({
        publicKey: s.publicKey.toBase58(),
        signature: s.signature
      }))

    const response =
      await this.solanaWeb3Manager.transactionHandler.handleTransaction({
        instructions: tx.instructions,
        // TODO: Figure out
        errorMapping: audiusDataErrorMapping,
        feePayerOverride: this.solanaWeb3Manager.feePayerKey,
        recentBlockhash: tx.recentBlockhash,
        logger: console,
        sendBlockhash: true,
        signatures
      })
    return response
  }

  /**
   * Creates a solana transaction for initAdmin
   *
   * @memberof SolanaWeb3Manager
   */
  async initAdmin(
    params: Omit<AudiusData.InitAdminParams, 'payer' | 'program'>
  ) {
    if (!this.program || !this.solanaWeb3Manager.feePayerKey) return
    // initAdmin = ({ payer, program, adminKeypair, adminStorageKeypair, verifierKeypair, })
    const tx = AudiusData.initAdmin({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for initUser
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async initUser(
    params: OmitAndRequire<
      AudiusData.InitUserParams,
      'program' | 'payer',
      'userId' | 'metadata'
    >
  ) {
    if (!this.didInit()) return
    // TODO: implement
    // initUser = ({ payer, program, ethAddress, userId, bumpSeed, replicaSet, replicaSetBumps, metadata, userStorageAccount, baseAuthorityAccount, adminStorageAccount, adminAuthorityPublicKey, cn1, cn2, cn3, })
    const tx = AudiusData.initUser({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for initUserSolPubkey
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async initUserSolPubkey(
    params: Omit<
      AudiusData.InitUserSolPubkeyParams,
      'program' | 'ethPrivateKey' | 'message'
    > & {
      userId: BN
    }
  ) {
    if (!this.didInit()) return

    const userSolKeypair = this.getUserKeyPair()
    const { userAccount } = await this.getUserIdSeed(params.userId)
    const tx = AudiusData.initUserSolPubkey({
      program: this.program,
      ethPrivateKey: this.web3Manager.ownerWallet.getPrivateKeyString(),
      message: userSolKeypair.publicKey.toBytes(),
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for createContentNode
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async createContentNode(
    params: OmitAndRequire<
      AudiusData.CreateContentNodeParams,
      'program',
      | 'spID'
      | 'payer'
      | 'adminAccount'
      | 'adminAuthorityPublicKey'
      | 'baseAuthorityAccount'
      | 'spID'
      | 'contentNodeAuthority'
      | 'contentNodeAccount'
      | 'ownerEthAddress'
    >
  ) {
    if (!this.program) return
    const tx = AudiusData.createContentNode({
      program: this.program,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for updateUserReplicaSet
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async updateUserReplicaSet(
    params: Omit<AudiusData.UpdateUserReplicaSetParams, 'program' | 'payer'>
  ) {
    if (!this.program || !this.solanaWeb3Manager.feePayerKey) return
    const tx = AudiusData.updateUserReplicaSet({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for publicCreateOrUpdateContentNode
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async publicCreateOrUpdateContentNode(
    params: Omit<
      AudiusData.PublicCreateOrUpdateContentNodeParams,
      'program' | 'payer'
    >
  ) {
    const tx = AudiusData.publicCreateOrUpdateContentNode({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for publicDeleteContentNode
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async publicDeleteContentNode(
    params: Omit<AudiusData.PublicDeleteContentNodeParams, 'program' | 'payer'>
  ) {
    const tx = AudiusData.publicDeleteContentNode({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for createUser
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async createUser(
    params: OmitAndRequire<
      AudiusData.CreateUserParams,
      'program' | 'payer',
      'userId' | 'metadata'
    > & {
      cn1SpId: number
      cn2SpId: number
      cn3SpId: number
    }
  ) {
    if (!this.didInit()) return

    const ethAccount = {
      privateKey: this.web3Manager.ownerWallet.getPrivateKeyString(),
      address: this.web3Manager.ownerWallet.getAddressString()
    }

    const userSolKeypair = this.getUserKeyPair()
    const { userAccount, bumpSeed, baseAuthorityAccount } =
      await this.getUserIdSeed(params.userId)

    const spSeedAddresses = await Promise.all(
      [params.cn1SpId, params.cn2SpId, params.cn3SpId].map(
        async (id) => await this.getContentNodeSeedAddress(id)
      )
    )

    const tx = AudiusData.createUser({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      ethAccount: ethAccount as any,
      userId: params.userId,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      message: userSolKeypair.publicKey.toBytes(),
      replicaSet: [params.cn1SpId, params.cn2SpId, params.cn3SpId],
      replicaSetBumps: spSeedAddresses.map(({ bumpSeed }) => bumpSeed),
      cn1: spSeedAddresses[0].derivedAddress,
      cn2: spSeedAddresses[1].derivedAddress,
      cn3: spSeedAddresses[2].derivedAddress,
      metadata: params.metadata
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for updateUser
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async updateUser(
    params: OmitAndRequire<
      AudiusData.UpdateUserParams,
      'program',
      'metadata'
    > & { userId: anchor.BN }
  ) {
    if (!this.didInit()) return

    const { userAccount } = await this.getUserIdSeed(params.userId)
    const userSolKeypair = this.getUserKeyPair()
    const tx = AudiusData.updateUser({
      program: this.program,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegate: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      metadata: params.metadata
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for updateAdmin
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async updateAdmin(params: Omit<AudiusData.UpdateAdminParams, 'program'>) {
    if (
      !this.program ||
      !this.solanaWeb3Manager.feePayerKey ||
      !this.adminStoragePublicKey
    )
      return

    // updateAdmin = ({ program, isWriteEnabled, adminStorageAccount, adminAuthorityKeypair, })
    const tx = AudiusData.updateAdmin({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for initAuthorityDelegationStatus
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async initAuthorityDelegationStatus(
    params: Omit<
      AudiusData.InitAuthorityDelegationStatusParams,
      'program' | 'payer'
    >
  ) {
    // initAuthorityDelegationStatus = ({ program, authorityName, userAuthorityDelegatePublicKey, authorityDelegationStatusPDA, payer, })
    const tx = AudiusData.initAuthorityDelegationStatus({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for revokeAuthorityDelegation
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async revokeAuthorityDelegation(
    params: Omit<
      AudiusData.RevokeAuthorityDelegationParams,
      'program' | 'payer'
    >
  ) {
    // revokeAuthorityDelegation = ({ program, authorityDelegationBump, userAuthorityDelegatePublicKey, authorityDelegationStatusPDA, payer, })
    const tx = AudiusData.revokeAuthorityDelegation({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for addUserAuthorityDelegate
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async addUserAuthorityDelegate(
    params: Omit<AudiusData.AddUserAuthorityDelegateParams, 'program' | 'payer'>
  ) {
    // addUserAuthorityDelegate = ({ program, baseAuthorityAccount, delegatePublicKey, user, authorityDelegationStatus, currentUserAuthorityDelegate, userId, userBumpSeed, adminStoragePublicKey, signerUserAuthorityDelegate, authorityPublicKey, payer, })
    const tx = AudiusData.addUserAuthorityDelegate({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for removeUserAuthorityDelegate
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async removeUserAuthorityDelegate(
    params: Omit<
      AudiusData.RemoveUserAuthorityDelegateParams,
      'program' | 'payer'
    >
  ) {
    // removeUserAuthorityDelegate = ({ program, baseAuthorityAccount, delegatePublicKey, delegateBump, user, authorityDelegationStatus, currentUserAuthorityDelegate, userId, userBumpSeed, adminStoragePublicKey, signerUserAuthorityDelegate, authorityPublicKey, payer, })
    const tx = AudiusData.removeUserAuthorityDelegate({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for updateIsVerified
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async updateIsVerified(
    params: OmitAndRequire<
      AudiusData.UpdateIsVerifiedParams,
      'program' | 'verifierPublicKey',
      'userId'
    > & {
      verifierKeyPair: anchor.web3.Keypair
    }
  ) {
    if (!this.didInit()) return
    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    // updateIsVerified = ({ program, adminPublicKey, userStorageAccount, verifierPublicKey, baseAuthorityAccount, userId, bumpSeed, })
    const tx = AudiusData.updateIsVerified({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      bumpSeed,
      baseAuthorityAccount,
      userAccount,
      verifierPublicKey: params.verifierKeyPair.publicKey,
      ...params
    })
    await this.signTransaction(tx, params.verifierKeyPair)
    return await this.sendTx(tx)
  }

  // ============================= MANAGE ENTITY =============================

  /**
   * Creates a solana transaction for createTrack
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async createTrack(
    params: OmitAndRequire<
      AudiusData.CreateEntityParams,
      'program',
      'id' | 'userId' | 'metadata'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()
    const tx = AudiusData.createTrack({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userId: params.userId,
      id: params.id,
      metadata: params.metadata
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for updateTrack
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async updateTrack(
    params: OmitAndRequire<
      AudiusData.UpdateEntityParams,
      'program',
      'id' | 'userId' | 'metadata'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.updateTrack({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userId: params.userId,
      id: params.id,
      metadata: params.metadata
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for deleteTrack
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async deleteTrack(
    params: OmitAndRequire<
      AudiusData.DeleteEntityParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()
    const tx = AudiusData.deleteTrack({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userId: params.userId,
      id: params.id
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for createPlaylist
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async createPlaylist(
    params: OmitAndRequire<
      AudiusData.CreateEntityParams,
      'program',
      'id' | 'userId' | 'metadata'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()
    const tx = AudiusData.createPlaylist({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userId: params.userId,
      id: params.id,
      metadata: params.metadata
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for updatePlaylist
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async updatePlaylist(
    params: OmitAndRequire<
      AudiusData.UpdateEntityParams,
      'program',
      'id' | 'userId' | 'metadata'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()
    const tx = AudiusData.updatePlaylist({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      userId: params.userId,
      id: params.id,
      metadata: params.metadata
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for deletePlaylist
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async deletePlaylist(
    params: OmitAndRequire<
      AudiusData.DeleteEntityParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()
    const tx = AudiusData.deletePlaylist({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  // ============================= SOCIAL ACTIONS =============================

  /**
   * Creates a solana transaction for addTrackRepost
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async addTrackSave(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    // addTrackRepost = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.addTrackSave({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for deleteTrackSave
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async deleteTrackSave(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    // addTrackRepost = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.deleteTrackSave({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for addTrackRepost
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async addTrackRepost(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    // addTrackRepost = ({ program, baseAuthorityAccount, userStorageAccountPDA, userAuthorityDelegateAccountPDA, authorityDelegationStatusAccountPDA, userAuthorityPublicKey, userId, bumpSeed, adminStoragePublicKey, id, })
    const tx = AudiusData.addTrackRepost({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for deleteTrackRepost
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async deleteTrackRepost(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.deleteTrackRepost({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for addPlaylistSave
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async addPlaylistSave(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.addPlaylistSave({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for deletePlaylistSave
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async deletePlaylistSave(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.deletePlaylistSave({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for addPlaylistRepost
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async addPlaylistRepost(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.addPlaylistRepost({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for deletePlaylistRepost
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async deletePlaylistRepost(
    params: OmitAndRequire<
      AudiusData.EntitySocialActionParams,
      'program',
      'id' | 'userId'
    >
  ) {
    if (!this.didInit()) return

    const { bumpSeed, baseAuthorityAccount, userAccount } =
      await this.getUserIdSeed(params.userId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.deletePlaylistRepost({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  // ============================= USER ACTIONS =============================

  /**
   * Creates a solana transaction for followUser
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async followUser(
    params: OmitAndRequire<
      AudiusData.UserSocialActionParams,
      'program',
      'sourceUserId' | 'targetUserId'
    >
  ) {
    if (!this.didInit()) return

    const {
      bumpSeed: sourceUserBumpSeed,
      baseAuthorityAccount,
      userAccount: sourceUserAccount
    } = await this.getUserIdSeed(params.sourceUserId)
    const { bumpSeed: targetUserBumpSeed, userAccount: targetUserAccount } =
      await this.getUserIdSeed(params.targetUserId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.followUser({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      sourceUserAccount,
      sourceUserBumpSeed,
      targetUserAccount,
      targetUserBumpSeed,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for unfollowUser
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async unfollowUser(
    params: OmitAndRequire<
      AudiusData.UserSocialActionParams,
      'program',
      'sourceUserId' | 'targetUserId'
    >
  ) {
    if (!this.didInit()) return

    const {
      bumpSeed: sourceUserBumpSeed,
      baseAuthorityAccount,
      userAccount: sourceUserAccount
    } = await this.getUserIdSeed(params.sourceUserId)
    const { bumpSeed: targetUserBumpSeed, userAccount: targetUserAccount } =
      await this.getUserIdSeed(params.targetUserId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.unfollowUser({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      sourceUserAccount,
      sourceUserBumpSeed,
      targetUserAccount,
      targetUserBumpSeed,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for subscribeUser
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async subscribeUser(
    params: OmitAndRequire<
      AudiusData.UserSocialActionParams,
      'program',
      'sourceUserId' | 'targetUserId'
    >
  ) {
    if (!this.didInit()) return

    const {
      bumpSeed: sourceUserBumpSeed,
      baseAuthorityAccount,
      userAccount: sourceUserAccount
    } = await this.getUserIdSeed(params.sourceUserId)
    const { bumpSeed: targetUserBumpSeed, userAccount: targetUserAccount } =
      await this.getUserIdSeed(params.targetUserId)

    const userSolKeypair = this.getUserKeyPair()
    const tx = AudiusData.subscribeUser({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      sourceUserAccount,
      sourceUserBumpSeed,
      targetUserAccount,
      targetUserBumpSeed,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }

  /**
   * Creates a solana transaction for unsubscribeUser
   *
   * @param {{}} {}
   * @return {Promise<any>}
   * @memberof SolanaWeb3Manager
   */
  async unsubscribeUser(
    params: OmitAndRequire<
      AudiusData.UserSocialActionParams,
      'program',
      'sourceUserId' | 'targetUserId'
    >
  ) {
    if (!this.didInit()) return

    const {
      bumpSeed: sourceUserBumpSeed,
      baseAuthorityAccount,
      userAccount: sourceUserAccount
    } = await this.getUserIdSeed(params.sourceUserId)
    const { bumpSeed: targetUserBumpSeed, userAccount: targetUserAccount } =
      await this.getUserIdSeed(params.targetUserId)

    const userSolKeypair = this.getUserKeyPair()

    const tx = AudiusData.unsubscribeUser({
      program: this.program,
      adminAccount: this.adminStoragePublicKey,
      baseAuthorityAccount,
      sourceUserAccount,
      sourceUserBumpSeed,
      targetUserAccount,
      targetUserBumpSeed,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      userAuthorityDelegateAccount: SystemProgram.programId,
      authorityDelegationStatusAccount: SystemProgram.programId,
      ...params
    })
    await this.signTransaction(tx, userSolKeypair)
    return await this.sendTx(tx)
  }
}

module.exports = AnchorAudiusData
