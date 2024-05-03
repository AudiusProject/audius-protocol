import { useContext, useEffect } from 'react'

import { Status, UserCollection, ID } from '@audius/common/models'

import Header from 'components/header/mobile/Header'
import { HeaderContext } from 'components/header/mobile/HeaderContextProvider'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import MobilePageContainer from 'components/mobile-page-container/MobilePageContainer'
import { useSubPageHeader } from 'components/nav/store/context'
import { BASE_URL, EXPLORE_PAGE } from 'utils/route'

import styles from './CollectionsPage.module.css'
import { CollectionCard } from 'components/collection'

export type CollectionsPageProps = {
  title: string
  description: string
  collectionIds: ID[]
  status: Status
}

const ExplorePage = (props: CollectionsPageProps) => {
  const { title, description, collectionIds, status } = props
  useSubPageHeader()

  const playlistCards = collectionIds.map((id) => {
    return <CollectionCard key={id} id={id} size='xs' />
  })

  const cards = (
    <CardLineup
      containerClassName={styles.lineupContainer}
      cards={playlistCards}
    />
  )

  const { setHeader } = useContext(HeaderContext)
  useEffect(() => {
    setHeader(
      <>
        <Header title={title} />
      </>
    )
  }, [setHeader, title])

  return (
    <MobilePageContainer
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      containerClassName={styles.pageContainer}
      hasDefaultHeader
    >
      {status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        cards
      )}
    </MobilePageContainer>
  )
}

export default ExplorePage
