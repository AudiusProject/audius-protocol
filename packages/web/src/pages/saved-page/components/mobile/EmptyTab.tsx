import { ReactNode } from 'react'

import { Button } from '@audius/harmony'

import styles from './SavedPage.module.css'

const emptyTabMessages = {
  afterSaved: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending'
}

type EmptyTabProps = {
  message: string | ReactNode
  onClick: () => void
}

export const EmptyTab = (props: EmptyTabProps) => {
  const { message, onClick } = props
  return (
    <div className={styles.emptyTab}>
      <div className={styles.message}>{message}</div>
      <div className={styles.afterSaved}>{emptyTabMessages.afterSaved}</div>
      <Button variant='primary' onClick={onClick}>
        {emptyTabMessages.goToTrending}
      </Button>
    </div>
  )
}
