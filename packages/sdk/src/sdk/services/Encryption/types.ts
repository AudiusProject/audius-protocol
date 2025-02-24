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
