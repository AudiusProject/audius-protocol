import { ID, Status } from '@audius/common/models'
import { route } from '@audius/common/utils'

import { CollectionCard } from 'components/collection'
import { Header } from 'components/header/desktop/Header'
import CardLineup from 'components/lineup/CardLineup'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Page from 'components/page/Page'
import { BASE_URL } from 'utils/route'

import styles from './CollectionsPage.module.css'

const { EXPLORE_PAGE } = route

export type CollectionsPageProps = {
  title: string
  description: string
  collectionIds: ID[]
  status: Status
}

const CollectionsPage = (props: CollectionsPageProps) => {
  const { title, description, collectionIds, status } = props
  const header = <Header primary={title} secondary={description} />

  const cards = collectionIds.map((id) => {
    return <CollectionCard key={id} id={id} size='l' />
  })

  return (
    <Page
      title={title}
      description={description}
      canonicalUrl={`${BASE_URL}${EXPLORE_PAGE}`}
      contentClassName={styles.page}
      header={header}
    >
      {status === Status.LOADING ? (
        <LoadingSpinner className={styles.spinner} />
      ) : (
        <CardLineup cards={cards} cardsClassName={styles.cardsContainer} />
      )}
    </Page>
  )
}

export default CollectionsPage
