import React from 'react'

import { Button, ButtonType, IconDiscord } from '@audius/stems'

import { ModalBodyWrapper } from '../WalletModal'

import ClickableAddress from './ClickableAddress'
import styles from './DiscordModalBody.module.css'

type DiscordModalBodyProps = {
  discordCode: string
  onClickLaunch: () => void
}

const messages = {
  title:
    'To access the private token-holders only Discord channel and/or update your Discord role, send a DM to the Audius VIP Discord Bot (@$AUDIO-BOT) with this code',
  boxLabel: 'COPY THIS CODE',
  launch: 'LAUNCH THE VIP DISCORD'
}

const DiscordModalBody = ({
  discordCode,
  onClickLaunch
}: DiscordModalBodyProps) => {
  return (
    <ModalBodyWrapper>
      <div className={styles.title}>{messages.title}</div>
      <ClickableAddress
        label={messages.boxLabel}
        address={discordCode}
        isCompact
      />
      <Button
        className={styles.btn}
        text={messages.launch}
        onClick={onClickLaunch}
        type={ButtonType.PRIMARY_ALT}
        leftIcon={<IconDiscord />}
      />
    </ModalBodyWrapper>
  )
}

export default DiscordModalBody
