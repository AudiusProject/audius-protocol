export const getEnv = (): 'stage' | 'prod' => {
  if (process.env.audius_discprov_env === 'stage') {
    return 'stage'
  }
  return 'prod'
}

export const getHostname = () => {
  if (getEnv() === 'stage') {
    return 'https://staging.audius.co'
  }
  return 'https://audius.co'
}

export const getContentNode = () => {
  if (getEnv() === 'stage') {
    return 'https://creatornode5.staging.audius.co'
  }
  return 'https://creatornode.audius.co'
}
