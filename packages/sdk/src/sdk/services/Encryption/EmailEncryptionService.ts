import * as fs from 'fs'

import { base64 } from '@scure/base'
import { chunk } from 'lodash'

import type { Configuration } from '../..'
import { BaseAPI } from '../..'
import { CryptoUtils } from '../../utils/crypto'
import { encodeHashId } from '../../utils/hashId'
import type { AudiusWalletClient } from '../AudiusWalletClient'

import type {
  BatchEncryptionInput,
  BatchEncryptionResult,
  EncryptedEmailsResult,
  EncryptedKey,
  SharedSymmetricKey
} from './types'

// Types for encrypted data CSV
type EncryptedDataRecord = {
  email_owner_id: number
  encrypted_email: string
  encrypted_key_owner: string
  encrypted_key_seller: string
  encrypted_key_grantees: string[]
  seller_id: number
  grantee_ids: number[]
}

type PurchaseRecord = {
  buyer: {
    email: string
    user_id: number
  }
  seller_user_id: number
  grantee_user_ids: number[]
}

export class EmailEncryptionService extends BaseAPI {
  constructor(
    config: Configuration,
    private readonly audiusWalletClient: AudiusWalletClient
  ) {
    super(config)
  }

  /**
   * Creates a new symmetric key for email encryption
   * @returns The symmetric key as Uint8Array
   */
  createSymmetricKey(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32))
  }

  /**
   * Encrypts a symmetric key for a user using their public key and shared secret
   * @param userId The ID of the user to encrypt for
   * @param symmetricKey The symmetric key to encrypt
   * @returns The encrypted key as a base64 string
   */
  async encryptSymmetricKey(
    userId: string,
    symmetricKey: Uint8Array
  ): Promise<string> {
    const userPublicKey = await this.getPublicKey(userId)
    const sharedSecret = await this.audiusWalletClient.getSharedSecret({
      publicKey: userPublicKey
    })
    const encryptedKeyBytes = await CryptoUtils.encrypt(
      sharedSecret,
      symmetricKey
    )
    return base64.encode(encryptedKeyBytes)
  }

  /**
   * Decrypts a symmetric key using a user's shared secret
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
   * @param symmetricKey The symmetric key to use
   * @returns The encrypted email as a base64 string
   */
  async encryptEmail(email: string, symmetricKey: Uint8Array): Promise<string> {
    const encryptedBytes = await CryptoUtils.encryptString(symmetricKey, email)
    return base64.encode(encryptedBytes)
  }

  /**
   * Decrypts an email using a symmetric key
   * @param encryptedEmail The encrypted email as a base64 string
   * @param symmetricKey The symmetric key to use
   * @returns The decrypted email
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
   * Creates and distributes a symmetric key between an email owner and recipients
   * @param emailOwnerId The ID of the email owner
   * @param receivingIds List of user IDs who will receive access
   * @param grantorId The ID of the user granting access
   * @returns The encrypted symmetric keys for storage
   */
  async createSharedKey(
    emailOwnerId: string,
    receivingIds: string[],
    grantorId: string
  ): Promise<SharedSymmetricKey> {
    // Generate random symmetric key
    const symmetricKey = this.createSymmetricKey()

    // Include email owner in the list of recipients
    const allRecipientIds = [emailOwnerId, ...receivingIds]

    // Encrypt for each receiving user including the owner
    const receiverEncryptedKeys: EncryptedKey[] = await Promise.all(
      allRecipientIds.map(async (receivingId) => {
        const encryptedKey = await this.encryptSymmetricKey(
          receivingId,
          symmetricKey
        )
        return {
          receivingId,
          encryptedKey,
          grantorId
        }
      })
    )

    return {
      symmetricKey,
      receiverEncryptedKeys
    }
  }

  /**
   * Encrypts emails for multiple recipients
   * @param emailOwnerId The ID of the email owner
   * @param receivingIds List of user IDs who will receive access
   * @param grantorId The ID of the user granting access
   * @param emails List of emails to encrypt
   * @returns Object containing encrypted emails and encrypted symmetric keys
   */
  async encryptEmails(
    emailOwnerId: string,
    receivingIds: string[],
    grantorId: string,
    emails: string[]
  ): Promise<EncryptedEmailsResult> {
    // Create symmetric key for all recipients
    const { symmetricKey, receiverEncryptedKeys } = await this.createSharedKey(
      emailOwnerId,
      receivingIds,
      grantorId
    )

    // Encrypt emails with symmetric key
    const encryptedEmails = await Promise.all(
      emails.map((email) => this.encryptEmail(email, symmetricKey))
    )

    return {
      encryptedEmails,
      receiverEncryptedKeys
    }
  }

  /**
   * Batch encrypts emails for multiple recipients
   * @param data Array of objects containing email owner IDs, receiving IDs, and emails to encrypt
   * @returns Array of encryption results
   */
  async batchEncryptEmails(
    data: BatchEncryptionInput[]
  ): Promise<BatchEncryptionResult[]> {
    return Promise.all(
      data.map(
        async ({ email_owner_id, receiving_ids, grantor_id, emails }) => {
          const encodedOwnerId = encodeHashId(email_owner_id)
          const encodedReceivingIds = (
            receiving_ids?.map((id) => encodeHashId(id)) || []
          ).filter((id): id is string => id !== null)
          const encodedGrantorId = encodeHashId(grantor_id)

          if (!encodedOwnerId || !encodedGrantorId) {
            throw new Error('Invalid user ID')
          }

          const { encryptedEmails, receiverEncryptedKeys } =
            await this.encryptEmails(
              encodedOwnerId,
              encodedReceivingIds,
              encodedGrantorId,
              emails
            )

          return {
            email_owner_id,
            encryptedEmails,
            receiverEncryptedKeys
          }
        }
      )
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

  /**
   * Process and encrypt emails in batches for backfill
   * @param adminUserId The admin user ID to use as grantor
   * @param purchases The purchase records to process
   * @returns Array of encrypted data records
   */
  async processAndEncryptEmails(
    adminUserId: number,
    purchases: any[]
  ): Promise<EncryptedDataRecord[]> {
    // Process in smaller batches to manage memory and API limits
    const BATCH_SIZE = 50
    const allRecords = this.getAllRecordsFromPurchases(purchases)
    const batches = chunk(allRecords, BATCH_SIZE)

    const allResults: EncryptedDataRecord[] = []

    for (const batch of batches) {
      try {
        // Prepare batch input
        const batchInputs: BatchEncryptionInput[] = batch.map((record) => ({
          email_owner_id: record.buyer.user_id,
          emails: [record.buyer.email],
          receiving_ids: [record.seller_user_id, ...record.grantee_user_ids],
          grantor_id: adminUserId
        }))

        // Use batch encryption for efficiency
        const encryptionResults = await this.batchEncryptEmails(batchInputs)

        // Transform results into CSV format
        const results = encryptionResults.map((result, index) => {
          const originalRecord = batch[index]
          if (!originalRecord) {
            throw new Error(`Missing original record for index ${index}`)
          }

          const { email_owner_id, encryptedEmails, receiverEncryptedKeys } =
            result

          if (!encryptedEmails?.[0]) {
            throw new Error(
              `Missing encrypted email for record ${email_owner_id}`
            )
          }

          const ownerKey = receiverEncryptedKeys.find((k) => {
            return k.receivingId === encodeHashId(email_owner_id)
          })?.encryptedKey
          if (!ownerKey) {
            throw new Error(`Missing owner key for record ${email_owner_id}`)
          }

          const sellerKey = receiverEncryptedKeys.find(
            (k) => k.receivingId === encodeHashId(originalRecord.seller_user_id)
          )?.encryptedKey
          if (!sellerKey) {
            throw new Error(`Missing seller key for record ${email_owner_id}`)
          }

          const granteeKeys = originalRecord.grantee_user_ids
            .map((granteeId) => {
              const key = receiverEncryptedKeys.find(
                (k) => k.receivingId === encodeHashId(granteeId)
              )?.encryptedKey
              if (!key) {
                console.warn(
                  `Missing grantee key for grantee ${granteeId} in record ${email_owner_id}`
                )
              }
              return key
            })
            .filter((key): key is string => Boolean(key))

          return {
            email_owner_id,
            encrypted_email: encryptedEmails[0],
            encrypted_key_owner: ownerKey,
            encrypted_key_seller: sellerKey,
            encrypted_key_grantees: granteeKeys,
            seller_id: originalRecord.seller_user_id,
            grantee_ids: originalRecord.grantee_user_ids
          }
        })

        allResults.push(...results)

        // Add delay between batches to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (error) {
        console.error('Failed to process batch:', error)
        // Log failed batch for retry
        await this.logFailedBatch(batch, error)
      }
    }

    return allResults
  }

  /**
   * Log failed batches for retry
   * @param batch The failed batch
   * @param error The error that occurred
   */
  private async logFailedBatch(
    batch: PurchaseRecord[],
    error?: unknown
  ): Promise<void> {
    const failedBatchData = {
      timestamp: new Date().toISOString(),
      error: error?.toString(),
      records: batch
    }

    fs.appendFileSync(
      'failed_batches.json',
      JSON.stringify(failedBatchData) + '\n'
    )
  }

  /**
   * Flatten purchases data into records
   * @param purchases The purchases data to flatten
   * @returns Array of purchase records
   */
  private getAllRecordsFromPurchases(purchases: any[]): PurchaseRecord[] {
    const records: PurchaseRecord[] = []

    for (const purchase of purchases) {
      const { seller_user_id, grantee_user_ids, buyer_details } = purchase
      for (const buyer of buyer_details) {
        records.push({
          buyer,
          seller_user_id,
          grantee_user_ids: grantee_user_ids || []
        })
      }
    }

    return records
  }
}
