import { IconButton, IconButtonProps } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ palette }) => ({
  icon: {
    height: 28,
    width: 28
  }
}))

type TopBarIconButtonProps = IconButtonProps

export const TopBarIconButton = (props: TopBarIconButtonProps) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  return (
    <IconButton
      styles={{ icon: styles.icon }}
      fill={neutralLight4}
      {...props}
    />
  )
}
