export const getAmplitudeAPIKey = () => {
  return process.env.VITE_AMPLITUDE_KEY
}

export const getAmplitudeProxy = () => {
  return process.env.VITE_AMPLITUDE_API_PROXY
}

export const getIdentityEndpoint = () => {
  return process.env.VITE_IDENTITY_ENDPOINT
}

// Need some way to run against GA locally
export const getAPIHostname = () => {
  const localGAPort = process.env.VITE_LOCAL_GA_PORT
  if (localGAPort) {
    return `localhost:${localGAPort}`
  }
  return process.env.VITE_HOSTNAME
}

export const getAudiusHostname = () => {
  return process.env.VITE_HOSTNAME_REDIRECT
}

export const getIsMp3StreamOn = () => {
  return process.env.VITE_STREAM_MP3_ON === 'true'
}
