import { View } from 'react-native'

import { IconButton, IconCaretLeft } from '@audius/harmony-native'
import HeaderLogo from 'app/assets/images/audiusLogoHorizontalDeprecated.svg'
import { makeStyles } from 'app/styles'

const messages = {
  backLabel: 'Back'
}

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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {showBackButton ? (
          <IconButton
            style={styles.backButton}
            color='subdued'
            icon={IconCaretLeft}
            onPress={onPressBack}
            aria-label={messages.backLabel}
          />
        ) : null}
        <HeaderLogo style={styles.audiusLogoHeader} fill={'#C2C0CC'} />
      </View>
    </View>
  )
}

export default SignupHeader
