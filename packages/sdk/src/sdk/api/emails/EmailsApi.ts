import { base64 } from '@scure/base'

import type { Configuration } from '../..'
import { BaseAPI } from '../..'
import type { AuthService } from '../../services/Auth'
import { CryptoUtils } from '../../utils/crypto'
import { encodeHashId } from '../../utils/hashId'

import type {
  BatchEncryptionInput,
  BatchEncryptionResult,
  EncryptedEmailsResult,
  SharedSymmetricKey
} from './types'

export class EmailsApi extends BaseAPI {
  constructor(config: Configuration, private readonly auth: AuthService) {
    super(config)
  }

  /**
   * Creates and distributes a symmetric key between an owner and their grantees
   * @param ownerId The ID of the owner (e.g. seller, artist)
   * @param granteeIds List of grantee user IDs who will receive the encrypted key
   * @returns The encrypted symmetric keys for storage
   */
  async createSharedKey(
    ownerId: string,
    granteeIds: string[]
  ): Promise<SharedSymmetricKey> {
    // Generate random symmetric key
    const symmetricKey = crypto.getRandomValues(new Uint8Array(32))

    // Encrypt for owner
    const ownerPublicKey = await this.getPublicKey(ownerId)
    const ownerSharedSecret = await this.auth.getSharedSecret(ownerPublicKey)
    const ownerEncryptedKey = await CryptoUtils.encrypt(
      ownerSharedSecret,
      symmetricKey
    )

    // Encrypt for each grantee
    const granteeEncryptedKeys = await Promise.all(
      granteeIds.map(async (granteeId) => {
        const granteePublicKey = await this.getPublicKey(granteeId)
        const granteeSharedSecret = await this.auth.getSharedSecret(
          granteePublicKey
        )
        const encryptedKey = await CryptoUtils.encrypt(
          granteeSharedSecret,
          symmetricKey
        )
        return {
          granteeId,
          encryptedKey
        }
      })
    )

    return {
      ownerId,
      ownerEncryptedKey,
      granteeEncryptedKeys,
      symmetricKey
    }
  }

  /**
   * Decrypts the symmetric key for either an owner or grantee
   * @param encryptedKey The encrypted symmetric key
   * @param userId The ID of the user who encrypted the key
   * @returns The decrypted symmetric key
   */
  async decryptSymmetricKey(
    encryptedKey: Uint8Array,
    userId: string
  ): Promise<Uint8Array> {
    const userPublicKey = await this.getPublicKey(userId)
    const sharedSecret = await this.auth.getSharedSecret(userPublicKey)
    return await CryptoUtils.decrypt(sharedSecret, encryptedKey)
  }

  /**
   * Encrypts an email using a symmetric key
   * @param email The email to encrypt
   * @param symmetricKey The symmetric key to use for encryption
   * @returns The encrypted email as a Uint8Array
   */
  async encryptEmail(
    email: string,
    symmetricKey: Uint8Array
  ): Promise<Uint8Array> {
    return await CryptoUtils.encryptString(symmetricKey, email)
  }

  /**
   * Decrypts an email using a symmetric key
   * @param encryptedEmail The encrypted email
   * @param symmetricKey The symmetric key to use for decryption
   * @returns The decrypted email as a string
   */
  async decryptEmail(
    encryptedEmail: Uint8Array,
    symmetricKey: Uint8Array
  ): Promise<string> {
    return await CryptoUtils.decryptString(symmetricKey, encryptedEmail)
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
    const { symmetricKey, ownerEncryptedKey, granteeEncryptedKeys } =
      await this.createSharedKey(sellerId, granteeIds)

    // Encrypt emails with symmetric key
    const encryptedEmails = await Promise.all(
      emails.map((email) => this.encryptEmail(email, symmetricKey))
    )

    return {
      encryptedEmails,
      ownerKey: ownerEncryptedKey,
      granteeKeys: granteeEncryptedKeys
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

        const { encryptedEmails, ownerKey, granteeKeys } =
          await this.encryptEmails(
            encodedSellerId,
            encodedGranteeIds,
            buyer_details
          )

        return {
          seller_user_id,
          encryptedEmails,
          ownerKey,
          granteeKeys
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

/**
 *
 * - now figure out how to upload the encrypted emails and the shared keys
 * - figure out if the encrypted data should be stored as uint8array or base64
 * - how does entity manager come into play here?
 */
