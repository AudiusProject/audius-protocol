import { merge } from 'lodash'
import { ButtonProps, Pressable, PressableProps, Text } from 'react-native'

import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ typography, palette }, { variant }) => {
  const variantStyles = {
    primary: {
      text: {
        color: palette.primary
      }
    },
    secondary: {
      text: {
        color: palette.secondary
      }
    }
  }

  const baseStyles = {
    text: {
      ...typography.body
    }
  }

  return merge(baseStyles, variantStyles[variant])
})

type TextButtonProps = PressableProps &
  ButtonProps & {
    variant: 'primary' | 'secondary'
  }

export const TextButton = (props: TextButtonProps) => {
  const { title, variant, ...other } = props
  const styles = useStyles({ variant })
  return (
    <Pressable {...other}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  )
}
