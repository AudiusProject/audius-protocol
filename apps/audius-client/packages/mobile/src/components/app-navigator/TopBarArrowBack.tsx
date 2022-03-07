import IconCaretRight from 'app/assets/images/iconCaretRight.svg'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { IconButton } from '../core'

const useStyles = makeStyles(() => ({
  icon: {
    height: 28,
    width: 28,
    transform: [{ rotate: '180deg' }]
  }
}))

type TopBarArrowBackButton = {
  onPress?: () => void
}

export const TopBarArrowBack = (props: TopBarArrowBackButton) => {
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()

  return (
    <IconButton
      icon={IconCaretRight}
      fill={neutralLight4}
      styles={{ icon: styles.icon }}
      {...props}
    />
  )
}
