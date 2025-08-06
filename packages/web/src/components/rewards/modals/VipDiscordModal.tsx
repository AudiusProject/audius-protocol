import { useDiscordCode } from '@audius/common/api'
import { route } from '@audius/common/utils'
import { Button, IconDiscord } from '@audius/harmony'

import { useModalState } from 'common/hooks/useModalState'
import ModalDrawer from 'components/modal-drawer/ModalDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { env } from 'services/env'

import ClickableAddress from '../ClickableAddress'

import styles from './VipDiscordModal.module.css'

const { AUDIUS_DISCORD_LINK } = route

const messages = {
  title: 'Launch the VIP Discord',
  description:
    'To access the private token-holders only Discord channel and/or update your Discord role, send a DM to the Audius VIP Discord Bot (@$AUDIO-BOT) with this code',
  boxLabel: 'COPY THIS CODE',
  launch: 'LAUNCH THE VIP DISCORD'
}

export const VipDiscordModal = () => {
  const { data: discordCode } = useDiscordCode(env.WAUDIO_MINT_ADDRESS)
  const [isOpen, setIsOpen] = useModalState('VipDiscord')
  const isMobile = useIsMobile()

  const modalTitle = isMobile ? (
    <div className={styles.discordDrawerTitle}>{messages.title}</div>
  ) : (
    <div className={styles.titleWrapper}>
      <IconDiscord />
      {messages.title}
    </div>
  )

  const handleClick = () => {
    window.open(AUDIUS_DISCORD_LINK, '_blank')
  }

  const wm = useWithMobileStyle(styles.mobile)

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      bodyClassName={styles.modalBody}
      showTitleHeader
      title={modalTitle}
      dismissOnClickOutside
      showDismissButton
      contentHorizontalPadding={24}
    >
      <div className={wm(styles.modalContainer)}>
        <div className={styles.description}>{messages.description}</div>
        {discordCode ? (
          <ClickableAddress
            label={messages.boxLabel}
            address={discordCode}
            isCompact
          />
        ) : null}
        <Button
          variant='primary'
          css={(theme) => ({ margin: theme.spacing['2xl'] })}
          onClick={handleClick}
          iconLeft={IconDiscord}
        >
          {messages.launch}
        </Button>
      </div>
    </ModalDrawer>
  )
}
