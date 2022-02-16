import IconNotification from 'app/assets/images/iconNotification.svg'
import { Button } from 'app/components/core'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'

import { getProfile } from './selectors'

const messages = {
  subscribe: 'subscribe',
  subscribed: 'subscribed'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingHorizontal: 0,
    height: spacing(8),
    width: spacing(8),
    marginRight: spacing(2)
  }
}))

export const SubscribeButton = () => {
  const styles = useStyles()
  const { isSubscribed } = useSelectorWeb(getProfile)

  return (
    <Button
      style={styles.root}
      title={isSubscribed ? messages.subscribed : messages.subscribe}
      noText
      icon={IconNotification}
      variant={isSubscribed ? 'primary' : 'common'}
      size='small'
    />
  )
}
