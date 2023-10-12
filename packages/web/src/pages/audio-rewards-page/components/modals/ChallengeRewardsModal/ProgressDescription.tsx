import { ReactNode } from 'react'

import { Text } from '@audius/harmony'

import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import styles from './styles.module.css'

const messages = {
  task: 'Task'
}

/** Renders the description section for an audio challenge modal. A default label
 * is rendered if none is provided.
 */
export const ProgressDescription = ({
  description,
  label = messages.task
}: {
  label?: ReactNode
  description: ReactNode
}) => {
  const wm = useWithMobileStyle(styles.mobile)
  return (
    <div className={wm(styles.progressDescription)}>
      <Text
        variant='label'
        size='l'
        strength='strong'
        className={styles.verifiedChallenge}
      >
        {label}
      </Text>
      <Text variant='body'>{description}</Text>
    </div>
  )
}
