import { View } from 'react-native'

import { IconCaretLeft } from '@audius/harmony-native'
import HeaderLogo from 'app/assets/images/audiusLogoHorizontalDeprecated.svg'
import { IconButton } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const useStyles = makeStyles(({ palette, spacing }) => ({
  container: {
    zIndex: 15
  },
  header: {
    backgroundColor: palette.white,
    top: 0,
    height: 39,
    zIndex: 15,
    width: '100%',
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderColor: palette.neutralLight9
  },
  backButton: {
    width: spacing(6),
    height: spacing(6),
    marginLeft: spacing(4)
  },
  backButtonIcon: {
    width: spacing(6),
    height: spacing(6)
  },
  audiusLogoHeader: {
    position: 'absolute',
    alignSelf: 'center',
    top: spacing(2),
    marginBottom: spacing(4),
    zIndex: 3,
    height: spacing(6)
  }
}))

type SignupHeaderProps = {
  showBackButton?: boolean
  onPressBack?: () => void
}

const SignupHeader = (props: SignupHeaderProps) => {
  const { showBackButton, onPressBack } = props
  const styles = useStyles()
  const { neutralLight4 } = useThemeColors()
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {showBackButton ? (
          <IconButton
            styles={{
              root: styles.backButton,
              icon: styles.backButtonIcon
            }}
            fill={neutralLight4}
            icon={IconCaretLeft}
            onPress={onPressBack}
          />
        ) : null}
        <HeaderLogo style={styles.audiusLogoHeader} fill={'#C2C0CC'} />
      </View>
    </View>
  )
}

export default SignupHeader
