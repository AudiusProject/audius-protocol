export type EncryptedKey = {
  granteeId: string
  encryptedKey: Uint8Array
}

export type SharedSymmetricKey = {
  ownerId: string
  ownerEncryptedKey: Uint8Array
  granteeEncryptedKeys: EncryptedKey[]
  symmetricKey: Uint8Array
}

export type EncryptedEmailsResult = {
  encryptedEmails: Uint8Array[]
  ownerKey: Uint8Array
  granteeKeys: EncryptedKey[]
}

export type BatchEncryptionInput = {
  seller_user_id: number
  grantee_user_ids: number[] | null
  buyer_details: string[]
}

export type BatchEncryptionResult = {
  seller_user_id: number
  encryptedEmails: Uint8Array[]
  ownerKey: Uint8Array
  granteeKeys: EncryptedKey[]
}
