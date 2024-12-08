import { base64 } from '@scure/base'

import type { Configuration } from '../..'
import { BaseAPI } from '../..'
import { CryptoUtils } from '../../utils/crypto'
import { encodeHashId } from '../../utils/hashId'
import type { AudiusWalletClient } from '../AudiusWalletClient'

import type {
  BatchEncryptionInput,
  BatchEncryptionResult,
  EncryptedEmailsResult,
  SharedSymmetricKey
} from './types'

export class EmailEncryptionService extends BaseAPI {
  constructor(
    config: Configuration,
    private readonly audiusWalletClient: AudiusWalletClient
  ) {
    super(config)
  }

  /**
   * Creates and distributes a symmetric key between a primary user and their grantees
   * @param primaryUserId The ID of the primary user (e.g. seller, artist)
   * @param granteeIds List of grantee user IDs who will receive the encrypted key
   * @returns The encrypted symmetric keys for storage
   */
  async createSharedKey(
    primaryUserId: string,
    granteeIds: string[]
  ): Promise<SharedSymmetricKey> {
    // Generate random symmetric key
    const symmetricKey = crypto.getRandomValues(new Uint8Array(32))

    // Encrypt for primary user
    const primaryUserPublicKey = await this.getPublicKey(primaryUserId)
    const primaryUserSharedSecret =
      await this.audiusWalletClient.getSharedSecret({
        publicKey: primaryUserPublicKey
      })
    const primaryUserEncryptedKeyBytes = await CryptoUtils.encrypt(
      primaryUserSharedSecret,
      symmetricKey
    )
    const primaryUserEncryptedKey = base64.encode(primaryUserEncryptedKeyBytes)

    // Encrypt for each grantee
    const granteeEncryptedKeys = await Promise.all(
      granteeIds.map(async (granteeId) => {
        const granteePublicKey = await this.getPublicKey(granteeId)
        const granteeSharedSecret =
          await this.audiusWalletClient.getSharedSecret({
            publicKey: granteePublicKey
          })
        const encryptedKeyBytes = await CryptoUtils.encrypt(
          granteeSharedSecret,
          symmetricKey
        )
        return {
          granteeId,
          encryptedKey: base64.encode(encryptedKeyBytes)
        }
      })
    )

    return {
      primaryUserEncryptedKey,
      granteeEncryptedKeys,
      symmetricKey
    }
  }

  /**
   * Decrypts the symmetric key for either a primary user or grantee
   * @param encryptedKey The encrypted symmetric key as a base64 string
   * @param userId The ID of the user who encrypted the key
   * @returns The decrypted symmetric key
   */
  async decryptSymmetricKey(
    encryptedKey: string,
    userId: string
  ): Promise<Uint8Array> {
    const userPublicKey = await this.getPublicKey(userId)
    const sharedSecret = await this.audiusWalletClient.getSharedSecret({
      publicKey: userPublicKey
    })
    return await CryptoUtils.decrypt(sharedSecret, base64.decode(encryptedKey))
  }

  /**
   * Encrypts an email using a symmetric key
   * @param email The email to encrypt
   * @param symmetricKey The symmetric key to use for encryption
   * @returns The encrypted email as a base64 string
   */
  async encryptEmail(email: string, symmetricKey: Uint8Array): Promise<string> {
    const encryptedBytes = await CryptoUtils.encryptString(symmetricKey, email)
    return base64.encode(encryptedBytes)
  }

  /**
   * Decrypts an email using a symmetric key
   * @param encryptedEmail The encrypted email as a base64 string
   * @param symmetricKey The symmetric key to use for decryption
   * @returns The decrypted email as a string
   */
  async decryptEmail(
    encryptedEmail: string,
    symmetricKey: Uint8Array
  ): Promise<string> {
    return await CryptoUtils.decryptString(
      symmetricKey,
      base64.decode(encryptedEmail)
    )
  }

  /**
   * Encrypts emails for a seller and their grantees
   * @param sellerId The ID of the seller
   * @param granteeIds List of grantee user IDs
   * @param emails List of emails to encrypt
   * @returns Object containing encrypted emails and encrypted symmetric keys for both seller and grantees
   */
  async encryptEmails(
    sellerId: string,
    granteeIds: string[],
    emails: string[]
  ): Promise<EncryptedEmailsResult> {
    // Create symmetric key for seller and grantees
    const { symmetricKey, primaryUserEncryptedKey, granteeEncryptedKeys } =
      await this.createSharedKey(sellerId, granteeIds)

    // Encrypt emails with symmetric key
    const encryptedEmails = await Promise.all(
      emails.map((email) => this.encryptEmail(email, symmetricKey))
    )

    return {
      encryptedEmails,
      primaryUserEncryptedKey,
      granteeEncryptedKeys
    }
  }

  /**
   * Batch encrypts emails for multiple sellers and their grantees
   * @param data Array of objects containing seller IDs, grantee IDs, and emails to encrypt
   * @returns Array of encryption results for each seller
   */
  async batchEncryptEmails(
    data: BatchEncryptionInput[]
  ): Promise<BatchEncryptionResult[]> {
    return Promise.all(
      data.map(async ({ seller_user_id, grantee_user_ids, buyer_details }) => {
        const encodedSellerId = encodeHashId(seller_user_id)
        const encodedGranteeIds = (
          grantee_user_ids?.map((id) => encodeHashId(id)) || []
        ).filter((id): id is string => id !== null)

        if (!encodedSellerId) {
          throw new Error('Invalid seller ID')
        }

        const {
          encryptedEmails,
          primaryUserEncryptedKey,
          granteeEncryptedKeys
        } = await this.encryptEmails(
          encodedSellerId,
          encodedGranteeIds,
          buyer_details
        )

        return {
          seller_user_id,
          encryptedEmails,
          primaryUserEncryptedKey,
          granteeEncryptedKeys
        }
      })
    )
  }

  /**
   * Gets the public key for a user
   * @param userId The ID of the user to get the public key for
   * @returns The user's public key as a Uint8Array
   */
  private async getPublicKey(userId: string): Promise<Uint8Array> {
    const response = await this.request({
      path: `/comms/pubkey/${userId}`,
      method: 'GET',
      headers: {}
    })
    const json = await response.json()
    return base64.decode(json.data)
  }
}
