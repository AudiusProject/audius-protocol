import type { XButtonProps } from 'app/components/x-button'
import { XButton } from 'app/components/x-button'
import { makeStyles } from 'app/styles'

const messages = {
  share: 'Share'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    marginTop: spacing(4),
    alignSelf: 'flex-start'
  }
}))

type NotificationXButtonProps = XButtonProps

export const NotificationXButton = (props: NotificationXButtonProps) => {
  const styles = useStyles()

  return (
    <XButton style={styles.root} size='small' {...props}>
      {messages.share}
    </XButton>
  )
}
