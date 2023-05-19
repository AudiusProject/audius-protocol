export type CreateGrantParameters = {
  userId: string
  appApiKey: string
  /** Permissions to be added later, just implied "all except wallet actions" for now */
  // permissions: {}
}

export type RevokeGrantParameters = {
  userId: string
  appApiKey: string
}
