import { useState } from 'react'

import { IconArtistCoin } from '@audius/harmony'
import { Formik } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Page from 'components/page/Page'

import { ReviewPage, SetupPage, SplashScreen } from './components'
import { Phase } from './constants'
import { setupFormSchema } from './validation'

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

  const handleSplashContinue = () => {
    setPhase(Phase.SETUP)
  }

  const handleSetupContinue = () => {
    setPhase(Phase.REVIEW)
  }

  const handleSetupBack = () => {
    setPhase(Phase.SPLASH)
  }

  const handleReviewContinue = () => {
    // TODO: Handle final submission/next phase
    alert('Coin created successfully!')
  }

  const handleReviewBack = () => {
    setPhase(Phase.SETUP)
  }

  const handleFormSubmit = (values: any) => {
    // TODO: Handle form submission across all steps
    // For now, this represents completing the entire flow
    alert('Coin created successfully!') // Temporary success indicator
  }

  let page
  switch (phase) {
    case Phase.SPLASH:
      page = <SplashScreen onContinue={handleSplashContinue} />
      break
    case Phase.SETUP:
      page = (
        <SetupPage onContinue={handleSetupContinue} onBack={handleSetupBack} />
      )
      break
    case Phase.REVIEW:
      page = (
        <ReviewPage
          onContinue={handleReviewContinue}
          onBack={handleReviewBack}
        />
      )
      break
    default:
      page = <SplashScreen onContinue={handleSplashContinue} />
      break
  }

  return (
    <Formik
      initialValues={{
        coinName: '',
        coinSymbol: '',
        coinImage: null as File | null
      }}
      validationSchema={toFormikValidationSchema(setupFormSchema)}
      onSubmit={handleFormSubmit}
    >
      <Page
        title={messages.title}
        header={header}
        contentClassName='artist-coins-launchpad-page'
      >
        {page}
      </Page>
    </Formik>
  )
}
