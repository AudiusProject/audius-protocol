import type { IconButtonProps } from 'app/components/core'
import { IconButton } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(() => ({
  icon: {
    height: 20,
    width: 20
  }
}))

type TopBarIconButtonProps = IconButtonProps

export const TopBarIconButton = (props: TopBarIconButtonProps) => {
  const { styles: stylesProp, ...other } = props
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  return (
    <IconButton
      styles={{ icon: [styles.icon, stylesProp?.icon], root: stylesProp?.root }}
      fill={neutralLight4}
      {...other}
    />
  )
}
