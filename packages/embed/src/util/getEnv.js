export const getAmplitudeAPIKey = () => {
  return process.env.VITE_AMPLITUDE_KEY
}

export const getAmplitudeProxy = () => {
  return process.env.VITE_AMPLITUDE_API_PROXY
}

export const getIdentityEndpoint = () => {
  return process.env.VITE_IDENTITY_ENDPOINT
}

export const getAudiusHostname = () => {
  return process.env.VITE_HOSTNAME_REDIRECT
}
