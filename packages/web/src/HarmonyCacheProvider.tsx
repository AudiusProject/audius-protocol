import { ReactNode } from 'react'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'

export const harmonyCache = createCache({ key: 'harmony', prepend: true })

type HarmonyCacheProviderProps = {
  children: ReactNode
}

export const HarmonyCacheProvider = (props: HarmonyCacheProviderProps) => {
  const { children } = props
  return <CacheProvider value={harmonyCache}>{children}</CacheProvider>
}
