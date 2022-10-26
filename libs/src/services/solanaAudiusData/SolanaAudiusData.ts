import * as AudiusData from '@audius/anchor-audius-data'
import type { AudiusDataProgram } from '@audius/anchor-audius-data'
import anchor, { BN, Idl } from '@project-serum/anchor'
import type { SolanaWeb3Manager } from '../solana'
import type { Web3Manager } from '../web3Manager'
import { PublicKey, Keypair, SystemProgram, Transaction } from '@solana/web3.js'
import { SolanaUtils } from '../solana'
import { audiusDataErrorMapping } from './errors'
import type { Nullable } from '../../utils'

export type AnchorAudiusDataConfig = {
  // Program ID of the audius data program
  programId: string
  // Public Key of admin storage account
  adminAccount: string
}

type SeedAddress = {
  bumpSeed: number
  derivedAddress: anchor.web3.PublicKey
}

type OmitAndRequire<T, K extends keyof T, L extends keyof T> = Partial<
  Omit<T, K>
> &
  Required<Pick<T, L>>

/**
 * SolanaAudiusData acts as the interface to solana audius data programs from a client.
 * It wraps methods to create transactions.
 */
export class SolanaAudiusData {
  anchorAudiusDataConfig: AnchorAudiusDataConfig
  solanaWeb3Manager: SolanaWeb3Manager
  program!: AudiusDataProgram
  programId!: PublicKey
  adminAccount!: PublicKey
  provider!: anchor.Provider
  web3Manager: Nullable<Web3Manager>
  // Exposes all other methods from @audius/anchor-audius-data for ad hoc use
  AudiusData: any

  constructor(
    anchorAudiusDataConfig: AnchorAudiusDataConfig,
    solanaWeb3Manager: SolanaWeb3Manager,
    web3Manager: Nullable<Web3Manager>
  ) {
    this.anchorAudiusDataConfig = anchorAudiusDataConfig
    this.solanaWeb3Manager = solanaWeb3Manager
    this.web3Manager = web3Manager
    this.AudiusData = AudiusData
  }

  async init() {
    const { programId, adminAccount } = this.anchorAudiusDataConfig
    this.programId = SolanaUtils.newPublicKeyNullable(programId)
    this.adminAccount = SolanaUtils.newPublicKeyNullable(adminAccount)
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
  setAdminAccount(AdminAccount: PublicKey) {
    this.adminAccount = AdminAccount
  }

  // ============================= HELPERS =============================

  /**
   * Validate that the program, provider and base variables were initted
   * @returns {boolean} True if the class was initted
   */
  didInit() {
    return Boolean(
      this.programId &&
        this.adminAccount &&
        this.solanaWeb3Manager.feePayerKey &&
        this.program
    )
  }

  /**
   * Encodes and derives the user account, bump seed, and base authority
   */
  async getUserIdSeed(userId: BN) {
    // @ts-expect-error
    const userIdSeed = userId.toArrayLike(Uint8Array, 'le', 4)
    const {
      baseAuthorityAccount,
      bumpSeed,
      derivedAddress: userAccount
    } = await this.solanaWeb3Manager.findDerivedPair(
      this.programId,
      this.adminAccount,
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

  /**
   * Derives the user solana keypair using the user's eth private key
   */
  getUserKeyPair(): anchor.web3.Keypair {
    return anchor.web3.Keypair.fromSeed(
      this.web3Manager!.ownerWallet!.getPrivateKey()
    )
  }

  /**
   * Encodes and derives the content node account and bump seed
   */
  async getContentNodeSeedAddress(spId: number): Promise<SeedAddress> {
    const enc = new TextEncoder() // always utf-8
    const baseSpIdSeed = enc.encode('sp_id')
    const spIdValue = new anchor.BN(spId).toArray('le', 2)
    const { bumpSeed, derivedAddress } =
      await this.solanaWeb3Manager.findDerivedPair(
        this.programId,
        this.adminAccount,
        new Uint8Array([...baseSpIdSeed, ...spIdValue])
      )
    return {
      bumpSeed,
      derivedAddress
    }
  }

  /**
   * Signs a transaction using the user's key pair
   * NOTE: The blockhash and feepayer must be set when signing and passed along
   * with the transaction for further signatures for consitency or the signature
   * will be invalide
   */
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

  /**
   * Submits a transaction via the solanaWeb3Manager transactionHandler passing along
   * the signtures.
   * This base method is used to send all transactions in this class
   */
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
        errorMapping: audiusDataErrorMapping,
        feePayerOverride: this.solanaWeb3Manager.feePayerKey,
        recentBlockhash: tx.recentBlockhash,
        logger: console,
        sendBlockhash: true,
        signatures
      })
    return response
  }

  // ============================= PROGRAM METHODS =============================

  /**
   * Creates an admin account
   * @memberof SolanaWeb3Manager
   */
  async initAdmin(
    params: Omit<AudiusData.InitAdminParams, 'payer' | 'program'>
  ) {
    if (!this.program || !this.solanaWeb3Manager.feePayerKey) return
    const tx = AudiusData.initAdmin({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a user account to be claimed.
   * NOTE: This transaction needs to be signed by the admin account
   * @memberof SolanaWeb3Manager
   */
  async initUser(
    params: OmitAndRequire<
      AudiusData.InitUserParams,
      'program' | 'payer',
      | 'userId'
      | 'metadata'
      | 'ethAddress'
      | 'bumpSeed'
      | 'userAccount'
      | 'baseAuthorityAccount'
      | 'cn1'
      | 'cn2'
      | 'cn3'
      | 'replicaSet'
      | 'replicaSetBumps'
      | 'adminAuthorityPublicKey'
    >
  ) {
    if (!this.didInit()) return
    const tx = AudiusData.initUser({
      payer: this.solanaWeb3Manager.feePayerKey,
      program: this.program,
      adminAccount: this.adminAccount,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Claims a user account that is created via init user using secp
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
      ethPrivateKey: this.web3Manager!.ownerWallet!.getPrivateKeyString(),
      message: userSolKeypair.publicKey.toBytes(),
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey
    })
    return await this.sendTx(tx)
  }

  /**
   * Creates a content node account
   * NOTE: This transaction must be signed by the admin account
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
   * Updates the user replica set in the user account
   * NOTE: This transaction must be signed by a replica or the user's authority
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
   * Create or update a content node using attestations from multiple content nodes
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
   * Deletes a content node using attestations from multiple content nodes
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
   * Creates a user account
   * NOTE: This method can only we called after the admin account is write enabled false
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
      privateKey: this.web3Manager?.ownerWallet?.getPrivateKeyString(),
      address: this.web3Manager?.ownerWallet?.getAddressString()
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
      adminAccount: this.adminAccount,
      baseAuthorityAccount,
      ethAccount: ethAccount as any,
      userId: params.userId,
      bumpSeed,
      userAccount,
      userAuthorityPublicKey: userSolKeypair.publicKey,
      message: userSolKeypair.publicKey.toBytes(),
      replicaSet: [params.cn1SpId, params.cn2SpId, params.cn3SpId],
      replicaSetBumps: spSeedAddresses.map(({ bumpSeed }) => bumpSeed),
      cn1: (spSeedAddresses[0] as SeedAddress).derivedAddress,
      cn2: (spSeedAddresses[1] as SeedAddress).derivedAddress,
      cn3: (spSeedAddresses[2] as SeedAddress).derivedAddress,
      metadata: params.metadata
    })
    return await this.sendTx(tx)
  }

  /**
   * Updates a user account
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
   * Updates the admin account, used for write enabled
   * @memberof SolanaWeb3Manager
   */
  async updateAdmin(params: Omit<AudiusData.UpdateAdminParams, 'program'>) {
    if (
      !this.program ||
      !this.solanaWeb3Manager.feePayerKey ||
      !this.adminAccount
    )
      return

    const tx = AudiusData.updateAdmin({
      program: this.program,
      ...params
    })
    return await this.sendTx(tx)
  }

  async initAuthorityDelegationStatus(
    params: Omit<
      AudiusData.InitAuthorityDelegationStatusParams,
      'program' | 'payer'
    >
  ) {
    const tx = AudiusData.initAuthorityDelegationStatus({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  async revokeAuthorityDelegation(
    params: Omit<
      AudiusData.RevokeAuthorityDelegationParams,
      'program' | 'payer'
    >
  ) {
    const tx = AudiusData.revokeAuthorityDelegation({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  async addUserAuthorityDelegate(
    params: Omit<AudiusData.AddUserAuthorityDelegateParams, 'program' | 'payer'>
  ) {
    const tx = AudiusData.addUserAuthorityDelegate({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  async removeUserAuthorityDelegate(
    params: Omit<
      AudiusData.RemoveUserAuthorityDelegateParams,
      'program' | 'payer'
    >
  ) {
    const tx = AudiusData.removeUserAuthorityDelegate({
      program: this.program,
      payer: this.solanaWeb3Manager.feePayerKey,
      ...params
    })
    return await this.sendTx(tx)
  }

  /**
   * Updates a user to be verified
   * NOTE: This tx must be signed by the admin verifier
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

    const tx = AudiusData.updateIsVerified({
      program: this.program,
      adminAccount: this.adminAccount,
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
   * Creates a track
   *
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
      adminAccount: this.adminAccount,
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
   * Updates a track
   *
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
      adminAccount: this.adminAccount,
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
   * Deletes a track
   *
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
    const tx = AudiusData.addTrackSave({
      program: this.program,
      adminAccount: this.adminAccount,
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
    const tx = AudiusData.deleteTrackSave({
      program: this.program,
      adminAccount: this.adminAccount,
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
    const tx = AudiusData.addTrackRepost({
      program: this.program,
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
      adminAccount: this.adminAccount,
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
