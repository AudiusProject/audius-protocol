import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useEffect
} from 'react'

interface EnvVars {
  env: string
  optimizelySdkKey: string
  ddexKey: string
}

// Local testing sets overrides for env vars that would normally be fetched from the node
const envVarOverrides = {
  env: (import.meta.env.VITE_ENV_OVERRIDE ?? '') as string,
  optimizelySdkKey: (import.meta.env.VITE_OPTIMIZELY_SDK_KEY_OVERRIDE ??
    '') as string,
  ddexKey: (import.meta.env.VITE_DDEX_KEY_OVERRIDE ?? '') as string
}
const endpoint = (import.meta.env.VITE_NODE_URL_OVERRIDE ||
  window.location.origin) as string

type EnvVarsContextType = EnvVars & { endpoint: string }
const EnvVarsContext = createContext<EnvVarsContextType>({
  ...envVarOverrides,
  endpoint
})

export const EnvVarsProvider = ({ children }: { children: ReactNode }) => {
  const [envVars, setEnvVars] = useState<EnvVars>(envVarOverrides)

  useEffect(() => {
    const fetchEnvVars = async () => {
      try {
        const response = await fetch(`${endpoint}/api/env`)
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        const data = (await response.json()) as EnvVars
        setEnvVars(data)
      } catch (error) {
        console.error('Error fetching env vars:', error)
      }
    }

    // Stage and prod nodes fetch env vars exposed in audius-docker-compose
    if (!envVars.env) {
      fetchEnvVars()
    }
  })

  const contextValue = { ...envVars, endpoint }
  return (
    <EnvVarsContext.Provider value={contextValue}>
      {children}
    </EnvVarsContext.Provider>
  )
}

export const useEnvVars = () => useContext(EnvVarsContext)
