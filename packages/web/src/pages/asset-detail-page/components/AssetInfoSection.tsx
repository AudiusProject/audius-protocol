import { useCallback, useState } from 'react'

import { WidthSizes } from '@audius/common/models'
import { AUDIUS_DISCORD_LINK } from '@audius/common/src/utils/route'
import {
  Flex,
  Paper,
  Text,
  useTheme,
  PlainButton,
  IconDiscord,
  PopupMenu,
  PopupMenuItem,
  IconKebabHorizontal,
  IconButton,
  IconRefresh
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import UserBadges from 'components/user-badges/UserBadges'
import { useCoverPhoto } from 'hooks/useCoverPhoto'
import {
  setUsers,
  setVisibility
} from 'store/application/ui/userListModal/slice'
import {
  UserListType,
  UserListEntityType
} from 'store/application/ui/userListModal/types'

import { ASSET_ROUTES, ASSET_INFO_SECTION_MESSAGES } from '../constants'
import { AssetDetailProps } from '../types'

import { UpdateDiscordRoleModal } from './UpdateDiscordRoleModal'

const messages = {
  title: 'Bronze +',
  profileFlair: 'Profile Flair',
  customDiscordRole: 'Custom Discord Role',
  messageBlasts: 'Message Blasts',
  openDiscord: 'Open The Discord',
  refreshDiscordRole: 'Refresh Discord Role'
}

const BANNER_HEIGHT = 120

const BannerSection = ({ assetName }: AssetDetailProps) => {
  const { name, userId, icon: TokenIcon } = ASSET_ROUTES[assetName]

  const { cornerRadius } = useTheme()

  const { image: coverPhoto } = useCoverPhoto({
    userId: userId || undefined,
    size: WidthSizes.SIZE_640
  })

  return (
    <Flex
      direction='column'
      alignItems='flex-start'
      alignSelf='stretch'
      h={BANNER_HEIGHT}
      css={{
        background: `linear-gradient(90deg, rgba(0, 0, 0, 0.05) 10%, rgba(0, 0, 0, 0.02) 20%, rgba(0, 0, 0, 0.01) 30%, rgba(0, 0, 0, 0) 45%), url("${coverPhoto}")`,
        backgroundSize: 'auto, cover',
        backgroundPosition: '0% 0%, 50% 50%',
        backgroundRepeat: 'repeat, no-repeat',
        position: 'relative'
      }}
    >
      <Flex
        direction='column'
        alignItems='flex-start'
        alignSelf='stretch'
        p='l'
        gap='s'
      >
        <Text variant='label' size='m' color='staticWhite' shadow='emphasis'>
          {ASSET_INFO_SECTION_MESSAGES.default.createdBy}
        </Text>

        <Flex
          alignItems='center'
          gap='xs'
          p='xs'
          backgroundColor='white'
          borderRadius='circle'
          border='default'
        >
          {TokenIcon ? (
            <TokenIcon size='l' css={{ borderRadius: cornerRadius.circle }} />
          ) : null}
          <Flex alignItems='center' gap='xs'>
            <Text variant='body' size='l'>
              {name}
            </Text>
            {userId && <UserBadges userId={userId} size='s' inline />}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export const AssetInfoSection = ({ assetName }: AssetDetailProps) => {
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false)

  const dispatch = useDispatch()
  const { title: assetTitle, symbol: assetSymbol } = ASSET_ROUTES[assetName]
  const CTAIcon = ASSET_INFO_SECTION_MESSAGES[assetName].ctaIcon

  const handleViewLeaderboard = () => {
    dispatch(
      setUsers({
        userListType: UserListType.COIN_LEADERBOARD,
        entityType: UserListEntityType.USER,
        entity: assetName
      })
    )
    dispatch(setVisibility(true))
  }

  const openDiscord = () => {
    window.open(AUDIUS_DISCORD_LINK, '_blank')
  }

  const handleOpenDiscordModal = useCallback(() => {
    setIsDiscordModalOpen(true)
  }, [])

  const handleCloseDiscordModal = useCallback(() => {
    setIsDiscordModalOpen(false)
  }, [])

  const menuItems: PopupMenuItem[] = [
    {
      text: messages.refreshDiscordRole,
      onClick: handleOpenDiscordModal,
      icon: <IconRefresh size='m' color='default' />
    }
  ]

  return (
    <>
      <UpdateDiscordRoleModal
        isOpen={isDiscordModalOpen}
        onClose={handleCloseDiscordModal}
        assetSymbol={assetSymbol}
      />
      <Paper
        borderRadius='l'
        shadow='far'
        direction='column'
        alignItems='flex-start'
      >
        <BannerSection assetName={assetName} />

        <Flex
          direction='column'
          alignItems='flex-start'
          alignSelf='stretch'
          p='xl'
          gap='l'
        >
          <Flex alignItems='center' alignSelf='stretch'>
            <Text variant='heading' size='s' color='heading'>
              {ASSET_INFO_SECTION_MESSAGES.default.whatIs(assetTitle)}
            </Text>
          </Flex>

          <Flex direction='column' gap='m'>
            {ASSET_INFO_SECTION_MESSAGES[assetName].description.map(
              (text, index) => (
                <Text
                  key={`${assetName}-description-${index}`}
                  variant='body'
                  size='m'
                  color='subdued'
                >
                  {text}
                </Text>
              )
            )}
          </Flex>
        </Flex>

        <Flex
          alignItems='center'
          justifyContent='space-between'
          alignSelf='stretch'
          p='xl'
          borderTop='default'
        >
          <Flex alignItems='center' justifyContent='center' gap='s'>
            <CTAIcon size='m' color='default' />
            <Text variant='title' size='m'>
              {ASSET_INFO_SECTION_MESSAGES[assetName].cta}
            </Text>
          </Flex>

          <PlainButton
            variant='default'
            size='default'
            onClick={handleViewLeaderboard}
          >
            View Leaderboard
          </PlainButton>
        </Flex>

        <Flex
          alignItems='center'
          justifyContent='space-between'
          alignSelf='stretch'
          p='xl'
          borderTop='default'
        >
          <Flex alignItems='center' justifyContent='center' gap='s'>
            <PlainButton
              onClick={openDiscord}
              iconLeft={IconDiscord}
              variant='default'
              size='default'
            >
              {messages.openDiscord}
            </PlainButton>
          </Flex>
          <PopupMenu
            items={menuItems}
            renderTrigger={(ref, triggerPopup) => (
              <IconButton
                ref={ref}
                aria-label='More options'
                size='m'
                icon={IconKebabHorizontal}
                onClick={() => triggerPopup()}
                color='default'
              />
            )}
          />
        </Flex>
      </Paper>
    </>
  )
}
