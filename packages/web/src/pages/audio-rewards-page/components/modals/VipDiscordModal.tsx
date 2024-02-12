import { vipDiscordModalSelectors } from '@audius/common/store'
import { IconDiscord } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import { useSelector } from 'react-redux'

import { useModalState } from 'common/hooks/useModalState'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'
import { TitleWrapper } from 'pages/audio-rewards-page/WalletModal'
import { AUDIUS_DISCORD_LINK } from 'utils/route'

import ClickableAddress from '../ClickableAddress'

import ModalDrawer from './ModalDrawer'
import styles from './VipDiscordModal.module.css'

const { getDiscordCode } = vipDiscordModalSelectors

const messages = {
  title: 'Launch the VIP Discord',
  description:
    'To access the private token-holders only Discord channel and/or update your Discord role, send a DM to the Audius VIP Discord Bot (@$AUDIO-BOT) with this code',
  boxLabel: 'COPY THIS CODE',
  launch: 'LAUNCH THE VIP DISCORD'
}

export const VipDiscordModal = () => {
  const discordCode = useSelector(getDiscordCode)
  const [isOpen, setIsOpen] = useModalState('VipDiscord')
  const isMobile = useIsMobile()

  const modalTitle = isMobile ? (
    <div className={styles.discordDrawerTitle}>{messages.title}</div>
  ) : (
    <TitleWrapper label={messages.title}>
      <IconDiscord />
    </TitleWrapper>
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
      useGradientTitle={false}
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
          className={styles.btn}
          text={messages.launch}
          onClick={handleClick}
          type={ButtonType.PRIMARY_ALT}
          leftIcon={<IconDiscord />}
        />
      </div>
    </ModalDrawer>
  )
}
