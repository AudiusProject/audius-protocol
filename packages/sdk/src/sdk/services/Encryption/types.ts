export type EncryptedKey = {
  granteeId: string
  encryptedKey: string
}

export type SharedSymmetricKey = {
  primaryUserEncryptedKey: string
  granteeEncryptedKeys: EncryptedKey[]
  symmetricKey: Uint8Array
}

export type EncryptedEmailsResult = {
  encryptedEmails: string[]
  ownerKey: string
  granteeKeys: EncryptedKey[]
}

export type BatchEncryptionInput = {
  seller_user_id: number
  grantee_user_ids: number[] | null
  buyer_details: string[]
}

export type BatchEncryptionResult = {
  seller_user_id: number
  encryptedEmails: string[]
  ownerKey: string
  granteeKeys: EncryptedKey[]
}
