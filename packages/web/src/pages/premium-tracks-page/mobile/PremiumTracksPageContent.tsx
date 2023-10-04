import { useContext, useEffect } from 'react'

import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { BASE_URL, EXPLORE_PREMIUM_TRACKS_PAGE } from 'utils/route'
import { createSeoDescription } from 'utils/seo'

import styles from './PremiumTracksPageContent.module.css'

const messages = {
  pageTitle: 'Premium Tracks',
  pageDescription: createSeoDescription(
    'Explore premium music available to purchase.'
  )
}

type PremiumTracksPageContentProps = {
  lineup: JSX.Element
}

export const PremiumTracksPageContent = ({
  lineup
}: PremiumTracksPageContentProps) => {
  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header title={messages.pageTitle} />
      </>
    )
  }, [setHeader])

  return (
    <MobilePageContainer
      title={messages.pageTitle}
      description={messages.pageDescription}
      canonicalUrl={`${BASE_URL}${EXPLORE_PREMIUM_TRACKS_PAGE}`}
      hasDefaultHeader
    >
      <div className={styles.container}>{lineup}</div>
    </MobilePageContainer>
  )
}
