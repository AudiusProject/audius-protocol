import { ClientOnly } from 'components/client-only/ClientOnly'

import { HarmonyCacheProvider } from '../HarmonyCacheProvider'
import { Root } from '../Root'

import { SsrContextProvider, SsrContextType } from './SsrContext'

type RootWithProvidersProps = SsrContextType

export const RootWithProviders = (props: RootWithProvidersProps) => {
  return (
    <HarmonyCacheProvider>
      <SsrContextProvider value={props}>
        <>
          <Root />
          <ClientOnly>
            {/* This is used in E2E tests to determine that client-side JS is loaded */}
            <div data-testid='app-hydrated'></div>
          </ClientOnly>
        </>
      </SsrContextProvider>
    </HarmonyCacheProvider>
  )
}

export default RootWithProviders
