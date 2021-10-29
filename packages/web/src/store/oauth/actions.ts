export const REQUEST_TWITTER_AUTH = 'OAUTH/REQUEST_TWITTER_AUTH'
export const REQUEST_INSTAGRAM_AUTH = 'OAUTH/REQUEST_INSTAGRAM_AUTH'

export function twitterAuth() {
  return { type: REQUEST_TWITTER_AUTH }
}

export function instagramAuth() {
  return { type: REQUEST_INSTAGRAM_AUTH }
}
