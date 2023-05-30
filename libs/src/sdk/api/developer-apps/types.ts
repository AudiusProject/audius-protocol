export type CreateDeveloperAppRequest = {
  userId: string
  name: string
  description?: string
  /** Set this to true if you're only using the API key for personal use on your own Audius account */
  isPersonalAccess?: boolean
}

export type DeleteDeveloperAppRequest = {
  userId: string
  appApiKey: string
}
