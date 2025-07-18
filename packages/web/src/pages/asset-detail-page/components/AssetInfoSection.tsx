import { WidthSizes } from '@audius/common/models'
import { Flex, Paper, Text, useTheme, PlainButton } from '@audius/harmony'
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

import { ACCEPTED_ROUTES, ASSET_INFO_SECTION_MESSAGES } from '../constants'
import { AssetDetailProps } from '../types'

const BANNER_HEIGHT = 120

const BannerSection = ({ mint }: AssetDetailProps) => {
  const { name, userId, icon: TokenIcon } = ACCEPTED_ROUTES[mint]

  const { cornerRadius } = useTheme()

  const { image: coverPhoto } = useCoverPhoto({
    userId,
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
            <UserBadges userId={userId} size='s' inline />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}

export const AssetInfoSection = ({ mint }: AssetDetailProps) => {
  const dispatch = useDispatch()
  const { title } = ACCEPTED_ROUTES[mint]
  const CTAIcon = ASSET_INFO_SECTION_MESSAGES[mint].ctaIcon

  const handleViewLeaderboard = () => {
    dispatch(
      setUsers({
        userListType: UserListType.COIN_LEADERBOARD,
        entityType: UserListEntityType.USER,
        entity: mint
      })
    )
    dispatch(setVisibility(true))
  }

  return (
    <Paper
      borderRadius='l'
      shadow='far'
      direction='column'
      alignItems='flex-start'
    >
      <BannerSection mint={mint} />

      <Flex
        direction='column'
        alignItems='flex-start'
        alignSelf='stretch'
        p='xl'
        gap='l'
      >
        <Flex alignItems='center' alignSelf='stretch'>
          <Text variant='heading' size='s' color='heading'>
            {ASSET_INFO_SECTION_MESSAGES.default.whatIs(title)}
          </Text>
        </Flex>

        <Flex direction='column' gap='m'>
          {ASSET_INFO_SECTION_MESSAGES[mint].description.map((text, index) => (
            <Text
              key={`${mint}-description-${index}`}
              variant='body'
              size='m'
              color='subdued'
            >
              {text}
            </Text>
          ))}
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
            {ASSET_INFO_SECTION_MESSAGES[mint].cta}
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
    </Paper>
  )
}
