import { Button, ButtonType } from '@audius/stems'
import React from 'react'
import { ModalBodyWrapper } from '../WalletModal'
import ClickableAddress from './ClickableAddress'

import styles from './DiscordModalBody.module.css'

type DiscordModalBodyProps = {
  discordCode: string
  onClickLaunch: () => void
}

const messages = {
  title:
    'The Audius VIP Discord Bot will DM you for this code, provide it for access to a private token-holders only channel',
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
      />
    </ModalBodyWrapper>
  )
}

export default DiscordModalBody
