import { useState } from 'react'

import { IconArtistCoin } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Page from 'components/page/Page'

import { SetupPage, SplashScreen } from './components'
import { Phase } from './constants'

const messages = {
  title: 'Create Your Artist Coin'
}

export const ArtistCoinsLaunchpad = () => {
  const [phase, setPhase] = useState(Phase.SPLASH)

  // Set up mobile header with icon
  useMobileHeader({
    title: messages.title
  })

  const header = <Header primary={messages.title} icon={IconArtistCoin} />

  const handleContinue = () => {
    setPhase(Phase.SETUP)
  }

  const handleBack = () => {
    setPhase(Phase.SPLASH)
  }

  let page
  switch (phase) {
    case Phase.SPLASH:
      page = <SplashScreen onContinue={handleContinue} />
      break
    case Phase.SETUP:
      page = <SetupPage onContinue={handleContinue} onBack={handleBack} />
      break
    default:
      page = <SplashScreen onContinue={handleContinue} />
      break
  }

  return (
    <Page
      title={messages.title}
      header={header}
      contentClassName='artist-coins-launchpad-page'
    >
      {page}
    </Page>
  )
}
