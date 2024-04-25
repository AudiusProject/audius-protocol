import { useCallback } from 'react'

import { Button } from '@audius/harmony'

import styles from './AppDetailsPage.module.css'
import { AuthorizedAppPageProps, AuthorizedAppsPages } from './types'

type AppDetailsPageProps = AuthorizedAppPageProps

const messages = {
  description: 'Description',
  goBack: 'Back'
}

export const AppDetailsPage = (props: AppDetailsPageProps) => {
  const { params, setPage } = props

  const handleGoBack = useCallback(() => {
    setPage(AuthorizedAppsPages.YOUR_APPS)
  }, [setPage])

  const { name, description } = params || {}
  if (!params) return null

  return (
    <div className={styles.root}>
      <h4 className={styles.appName}>{name}</h4>
      {!description ? null : (
        <span>
          <h5 className={styles.descriptionLabel}>{messages.description}</h5>
          <p className={styles.description}>{description}</p>
        </span>
      )}
      <Button variant='secondary' onClick={handleGoBack}>
        {messages.goBack}
      </Button>
    </div>
  )
}
