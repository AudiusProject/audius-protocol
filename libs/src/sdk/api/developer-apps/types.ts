export type CreateDeveloperAppRequest = {
  userId: string
  name: string
  // description: string
  /** True if the user only needs an API Key + Secret for personal use on their own account only */
  isPersonalAccess?: boolean
}

export type DeleteDeveloperAppRequest = {
  userId: string
  appApiKey: string
}
