import { HarmonyCacheProvider } from '../HarmonyCacheProvider'
import { Root } from '../Root'

import { SsrContextProvider, SsrContextType } from './SsrContext'

type RootWithProvidersProps = {
  ssrContextValue: SsrContextType
}

export const RootWithProviders = ({
  ssrContextValue
}: RootWithProvidersProps) => {
  return (
    <HarmonyCacheProvider>
      <SsrContextProvider value={ssrContextValue}>
        <Root />
      </SsrContextProvider>
    </HarmonyCacheProvider>
  )
}

export default RootWithProviders
