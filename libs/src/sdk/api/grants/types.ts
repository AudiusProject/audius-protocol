export type CreateGrantRequest = {
  userId: string
  appApiKey: string
  /** Permissions to be added later, just implied "all except wallet actions" for now */
  // permissions: {}
}

export type RevokeGrantRequest = {
  userId: string
  appApiKey: string
}
