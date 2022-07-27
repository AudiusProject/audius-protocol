import type { TwitterButtonProps } from 'app/components/twitter-button'
import { TwitterButton } from 'app/components/twitter-button'
import { makeStyles } from 'app/styles'

const messages = {
  share: 'Share'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(4),
    alignSelf: 'flex-start'
  },
  button: {
    paddingHorizontal: spacing(6)
  },
  icon: {
    height: 14,
    weight: 14
  }
}))

type NotificationTwitterButtonProps = TwitterButtonProps

export const NotificationTwitterButton = (
  props: NotificationTwitterButtonProps
) => {
  const styles = useStyles()
  return <TwitterButton styles={styles} {...props} title={messages.share} />
}
