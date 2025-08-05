import { useEffect, useState } from 'react'

import { useDiscordCode } from '@audius/common/api'
import { route } from '@audius/common/utils'
import { Button, IconDiscord, Text } from '@audius/harmony'

import ModalDrawer from 'components/modal-drawer/ModalDrawer'
import { useIsMobile } from 'hooks/useIsMobile'
import { useWithMobileStyle } from 'hooks/useWithMobileStyle'

import ClickableAddress from '../ClickableAddress'

import styles from './VipDiscordModal.module.css'

const { AUDIUS_DISCORD_LINK } = route

type ArtistCoinDiscordModalProps = {
  isOpen: boolean
  onClose: () => void
  coinSymbol?: string
  mint?: string
}

const messages = {
  title: 'Update Discord Role',
  getDescription: (coinSymbol?: string) =>
    coinSymbol
      ? `To access the private ${coinSymbol} holders Discord channel and/or update your Discord role, send a DM to the Audius VIP Discord Bot (@$AUDIO-BOT) with this code`
      : 'To access the private token-holders only Discord channel and/or update your Discord role, send a DM to the Audius VIP Discord Bot (@$AUDIO-BOT) with this code',
  boxLabel: 'COPY THIS CODE',
  launch: 'LAUNCH THE AUDIUS DISCORD'
}

export const ArtistCoinDiscordModal = ({
  isOpen,
  onClose,
  coinSymbol,
  mint
}: ArtistCoinDiscordModalProps) => {
  const isMobile = useIsMobile()
  const wm = useWithMobileStyle(styles.mobile)
  const [discordCode, setDiscordCode] = useState<string | null>(null)

  const discordCodeMutation = useDiscordCode()

  useEffect(() => {
    const generateCode = async () => {
      try {
        const code = await discordCodeMutation.mutateAsync({
          assetType: coinSymbol || 'AUDIO',
          mint
        })
        setDiscordCode(code)
      } catch (error) {
        console.error('Failed to generate Discord code:', error)
      }
    }

    if (isOpen && !discordCode && !discordCodeMutation.isPending) {
      generateCode()
    }
  }, [
    isOpen,
    discordCode,
    discordCodeMutation.isPending,
    discordCodeMutation,
    coinSymbol,
    mint
  ])

  const modalTitle = isMobile ? (
    <div className={styles.discordDrawerTitle}>{messages.title}</div>
  ) : (
    <div className={styles.titleWrapper}>
      <IconDiscord />
      {messages.title}
    </div>
  )

  const handleLaunchDiscord = () => {
    window.open(AUDIUS_DISCORD_LINK, '_blank')
  }

  return (
    <ModalDrawer
      isOpen={isOpen}
      onClose={onClose}
      bodyClassName={styles.modalBody}
      showTitleHeader
      title={modalTitle}
      dismissOnClickOutside
      showDismissButton
      contentHorizontalPadding={24}
    >
      <div className={wm(styles.modalContainer)}>
        <div className={styles.description}>
          {messages.getDescription(coinSymbol)}
        </div>
        {discordCodeMutation.isPending ? (
          <Text variant='body' color='subdued'>
            Generating code...
          </Text>
        ) : discordCode ? (
          <ClickableAddress
            label={messages.boxLabel}
            address={discordCode}
            isCompact
          />
        ) : discordCodeMutation.isError ? (
          <Text variant='body' color='danger'>
            Failed to generate code. Please try again.
          </Text>
        ) : null}
        <Button
          variant='primary'
          css={(theme) => ({ margin: theme.spacing['2xl'] })}
          onClick={handleLaunchDiscord}
          iconLeft={IconDiscord}
        >
          {messages.launch}
        </Button>
      </div>
    </ModalDrawer>
  )
}
