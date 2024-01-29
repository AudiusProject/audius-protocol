import { wait } from '@audius/common'
import NetInfo from '@react-native-community/netinfo'
import { View } from 'react-native'
import { useAsyncFn } from 'react-use'

import { IconNoWifi } from '@audius/harmony-native'
import { IconRefresh } from '@audius/harmony-native'
import { Button, Text, Tile } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const messages = {
  reloading: (isReloading: boolean) =>
    isReloading ? 'Reloading...' : 'Reload',
  title: `You’re Offline`,
  subtitle: `We Couldn’t Load the Page.\nConnect to the Internet and Try Again.`
}

const useStyles = makeStyles(({ typography, spacing }) => ({
  button: {
    marginVertical: spacing(4)
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontByWeight.bold,
    marginVertical: spacing(4)
  },
  icon: {
    height: spacing(4),
    width: spacing(4)
  },
  root: {
    padding: spacing(4),
    paddingBottom: spacing(0),
    margin: spacing(3)
  },
  subHeading: {
    fontSize: typography.fontSize.small,
    textAlign: 'center',
    lineHeight: 21
  }
}))

export type OfflinePlaceholderProps = {
  unboxed?: boolean
}

export const OfflinePlaceholder = (props: OfflinePlaceholderProps) => {
  const { unboxed } = props
  const styles = useStyles()
  const [{ loading: isRefreshing }, handleRefresh] = useAsyncFn(async () => {
    // NetInfo.refresh() usually returns almost instantly
    // Introduce minimum wait to convince user we took action
    return await Promise.all([NetInfo.refresh(), wait(800)])
  })

  const { neutralLight4 } = useThemeColors()

  const body = (
    <View style={styles.container}>
      <IconNoWifi fill={neutralLight4} />
      <Text style={styles.header}>{messages.title}</Text>
      <Text style={styles.subHeading} allowNewline>
        {messages.subtitle}
      </Text>
      <Button
        title={messages.reloading(isRefreshing)}
        disabled={isRefreshing}
        fullWidth
        icon={IconRefresh}
        iconPosition='left'
        onPress={handleRefresh}
        styles={{ root: styles.button, icon: styles.icon }}
        size='large'
      />
    </View>
  )

  return unboxed ? (
    <View style={styles.root}>{body}</View>
  ) : (
    <Tile styles={{ tile: styles.root }}>{body}</Tile>
  )
}
