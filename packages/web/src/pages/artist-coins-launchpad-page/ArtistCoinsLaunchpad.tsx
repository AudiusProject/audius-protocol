import { useState } from 'react'

import { IconArtistCoin } from '@audius/harmony'
import { Formik, useFormikContext } from 'formik'
import { toFormikValidationSchema } from 'zod-formik-adapter'

import { Header } from 'components/header/desktop/Header'
import { useMobileHeader } from 'components/header/mobile/hooks'
import Page from 'components/page/Page'

import { ReviewPage, SetupPage, SplashScreen } from './components'
import type { SetupFormValues } from './components/types'
import { Phase } from './constants'
import { setupFormSchema } from './validation'

const messages = {
  title: 'Create Your Artist Coin'
}

const ArtistCoinsLaunchpadContent = () => {
  const [phase, setPhase] = useState(Phase.SPLASH)
  const { resetForm } = useFormikContext()

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
    resetForm()
    setPhase(Phase.SPLASH)
  }

  const handleReviewContinue = () => {
    // TODO: Handle final submission/next phase
    alert('Coin created successfully!')
  }

  const handleReviewBack = () => {
    setPhase(Phase.SETUP)
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
    <Page
      title={messages.title}
      header={header}
      contentClassName='artist-coins-launchpad-page'
    >
      {page}
    </Page>
  )
}

export const ArtistCoinsLaunchpad = () => {
  return (
    <Formik
      initialValues={{
        coinName: '',
        coinSymbol: '',
        coinImage: null as File | null
      }}
      validationSchema={toFormikValidationSchema(setupFormSchema)}
      onSubmit={(values: SetupFormValues) => {
        // Convert coin symbol to uppercase before submission
        // TODO: Use the processed values in actual submission logic
        // const finalValues = {
        //   ...values,
        //   coinSymbol: values.coinSymbol.toUpperCase()
        // }

        // For now, this represents completing the entire flow
        alert('Coin created successfully!') // Temporary success indicator
      }}
    >
      <ArtistCoinsLaunchpadContent />
    </Formik>
  )
}
