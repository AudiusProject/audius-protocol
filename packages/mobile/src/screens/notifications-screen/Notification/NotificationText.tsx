import { Text, TextProps } from 'app/components/core'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ typography }) => ({
  root: {
    fontSize: typography.fontSize.large
  }
}))

type NotificationTextProps = TextProps

export const NotificationText = (props: NotificationTextProps) => {
  const { children, ...other } = props
  const styles = useStyles()

  return (
    <Text style={styles.root} {...other}>
      {children}
    </Text>
  )
}
