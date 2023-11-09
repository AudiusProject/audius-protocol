import { useState, useEffect } from 'react'

interface EnvVars {
  env: string
  nodeType: string
}

const useEnvVars = () => {
  // These overrides are only set when testing locally
  const [envVars, setEnvVars] = useState<EnvVars>({
    env: import.meta.env.VITE_ENV_OVERRIDE as string,
    nodeType: import.meta.env.VITE_NODE_TYPE_OVERRIDE as string,
  })

  const endpoint = (import.meta.env.VITE_NODE_URL_OVERRIDE || window.location.origin) as string

  useEffect(() => {
    // Any stage or prod deployment uses these values from the server it's running on
    const fetchEnvVars = async () => {
      if (!envVars.env || !envVars.nodeType) {
        try {
          const response = await fetch(`${endpoint}/up_api/env`)
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          const data = await response.json() as EnvVars
          setEnvVars({
            env: data.env,
            nodeType: data.nodeType,
          })
        } catch (error) {
          console.error('Error fetching env vars:', error)
        }
      }
    }

    void fetchEnvVars()
  })

  return { ...envVars, endpoint }
}

export default useEnvVars
