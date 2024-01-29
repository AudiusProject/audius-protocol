import { vipDiscordModalSelectors } from '@audius/common'
import { AUDIUS_DISCORD_LINK } from 'audius-client/src/utils/route'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { IconDiscord } from '@audius/harmony-native'
import { CopyTextTile } from 'app/components/copy-text-tile'
import { Text, Button } from 'app/components/core'
import Drawer, { useDrawerState } from 'app/components/drawer'
import { makeStyles } from 'app/styles'
const { getDiscordCode } = vipDiscordModalSelectors

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

export const VipDiscordDrawer = () => {
  const styles = useStyles()
  const { isOpen, onClose } = useDrawerState('VipDiscord')

  const discordCode = useSelector(getDiscordCode)

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      isFullscreen
      isGestureSupported={false}
      title={messages.title}
    >
      <View style={styles.container}>
        <Text style={styles.body}>{messages.body}</Text>
        {discordCode ? (
          <CopyTextTile hint={messages.copyThisCode} text={discordCode} />
        ) : null}
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
