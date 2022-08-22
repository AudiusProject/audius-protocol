import { useCallback } from 'react'

import {
  tokenDashboardPageActions,
  tokenDashboardPageSelectors
} from '@audius/common'
import { AUDIUS_DISCORD_LINK } from 'audius-client/src/utils/route'
import { View } from 'react-native'

import IconDiscord from 'app/assets/images/iconDiscord.svg'
import { CopyTextTile } from 'app/components/copy-text-tile'
import { Text, Button } from 'app/components/core'
import Drawer from 'app/components/drawer'
import { useDispatchWeb } from 'app/hooks/useDispatchWeb'
import { useSelectorWeb } from 'app/hooks/useSelectorWeb'
import { makeStyles } from 'app/styles'
const { getDiscordCode, getModalState, getModalVisible } =
  tokenDashboardPageSelectors
const { setModalState, setModalVisibility } = tokenDashboardPageActions

const messages = {
  title: 'Launch the VIP Discord',
  body: 'To access the private token-holders only Discord channel and/or update your Discord role, send a DM to the Audius VIP Discord Bot (@$AUDIO-BOT) with this code',
  launchDiscord: 'LAUNCH THE VIP DISCORD',
  copyThisCode: 'Copy This Code'
}

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  container: {
    margin: spacing(2)
  },
  launchDiscord: {
    marginTop: spacing(6)
  },
  body: {
    marginHorizontal: spacing(4),
    lineHeight: spacing(6),
    textAlign: 'center',
    color: palette.neutral,
    fontSize: typography.fontSize.medium,
    fontFamily: typography.fontByWeight.demiBold,
    marginBottom: spacing(6)
  }
}))

export const DiscordDrawer = () => {
  const styles = useStyles()
  const dispatchWeb = useDispatchWeb()

  // TODO: Discord modal state should probably be pulled out of token dashboard
  const modalVisible = useSelectorWeb(getModalVisible)
  const modalState = useSelectorWeb(getModalState)
  const discordCode = useSelectorWeb(getDiscordCode)

  const isOpen =
    modalVisible && modalState !== null && modalState.stage === 'DISCORD_CODE'

  const handleClose = useCallback(() => {
    dispatchWeb(setModalVisibility({ isVisible: false }))
    dispatchWeb(setModalState({ modalState: null }))
  }, [dispatchWeb])

  return (
    <Drawer
      isOpen={isOpen}
      onClose={handleClose}
      isFullscreen
      isGestureSupported={false}
      title={messages.title}
    >
      <View style={styles.container}>
        <Text style={styles.body}>{messages.body}</Text>
        <CopyTextTile hint={messages.copyThisCode} text={discordCode} />
        <Button
          style={styles.launchDiscord}
          title={messages.launchDiscord}
          variant='primary'
          size='medium'
          iconPosition='left'
          icon={IconDiscord}
          url={AUDIUS_DISCORD_LINK}
        />
      </View>
    </Drawer>
  )
}
