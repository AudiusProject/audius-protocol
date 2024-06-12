import type { ButtonProps } from '@audius/harmony-native'
import { Button } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

export type SocialButtonProps = ButtonProps

const useStyles = makeStyles(({ spacing }) => ({
  button: {
    padding: spacing(3),
    height: 64
  },
  text: {
    fontSize: 20
  },
  icon: {
    height: 20,
    width: 20,
    marginRight: spacing(3)
  }
}))

export const SocialButton = (props: SocialButtonProps) => {
  const styles = useStyles()

  return (
    <Button
      {...props}
      styles={{
        button: [styles.button, props.styles?.button],
        icon: [styles.icon, props.styles?.icon],
        root: props.styles?.root,
        text: [styles.text, props.styles?.text]
      }}
    />
  )
}
