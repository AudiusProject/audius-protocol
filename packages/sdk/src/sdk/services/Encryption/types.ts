export type EncryptedKey = {
  receivingId: string
  encryptedKey: string
  grantorId: string
}

export type SharedSymmetricKey = {
  symmetricKey: Uint8Array
  receiverEncryptedKeys: EncryptedKey[]
}

export type EncryptedEmailsResult = {
  encryptedEmails: string[]
  receiverEncryptedKeys: EncryptedKey[]
}

export type BatchEncryptionInput = {
  email_owner_id: number
  receiving_ids: number[] | null
  grantor_id: number
  emails: string[]
}

export type BatchEncryptionResult = {
  email_owner_id: number
  encryptedEmails: string[]
  receiverEncryptedKeys: EncryptedKey[]
}
