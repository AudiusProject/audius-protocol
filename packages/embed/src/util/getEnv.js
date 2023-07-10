export const getAmplitudeAPIKey = () => {
  return process.env.PREACT_APP_AMPLITUDE_KEY
}

export const getAmplitudeProxy = () => {
  return process.env.PREACT_APP_AMPLITUDE_API_PROXY
}

export const getIdentityEndpoint = () => {
  return process.env.PREACT_APP_IDENTITY_ENDPOINT
}

// Need some way to run against GA locally
export const getAPIHostname = () => {
  const localGAPort = process.env.PREACT_APP_LOCAL_GA_PORT
  if (localGAPort) {
    return `localhost:${localGAPort}`
  }
  return process.env.PREACT_APP_HOSTNAME
}

export const getAudiusHostname = () => {
  return process.env.PREACT_APP_HOSTNAME_REDIRECT
}

export const getIsMp3StreamOn = () => {
  return process.env.PREACT_APP_STREAM_MP3_ON === 'true'
}
