import { exploreMessages as messages } from '@audius/common/messages'
import { Flex, Text, useMedia } from '@audius/harmony'
import { useNavigate } from 'react-router-dom-v5-compat'

import PerspectiveCard, {
  TextInterior
} from 'components/perspective-card/PerspectiveCard'
import { useIsUSDCEnabled } from 'hooks/useIsUSDCEnabled'
import {
  PREMIUM_TRACKS,
  DOWNLOADS_AVAILABLE
} from 'pages/explore-page/collections'
import { BASE_URL, stripBaseUrl } from 'utils/route'

const justForYou = [PREMIUM_TRACKS, DOWNLOADS_AVAILABLE]

export const JustForYouSection = () => {
  const isUSDCPurchasesEnabled = useIsUSDCEnabled()
  const navigate = useNavigate()
  const { isLarge } = useMedia()

  const justForYouTiles = justForYou.filter((tile) => {
    const isPremiumTracksTile = tile.title === PREMIUM_TRACKS.title
    return !isPremiumTracksTile || isUSDCPurchasesEnabled
  })

  const onClickCard = (url: string) => {
    if (url.startsWith(BASE_URL)) {
      navigate(stripBaseUrl(url))
    } else if (url.startsWith('http')) {
      const win = window.open(url, '_blank')
      if (win) win.focus()
    } else {
      navigate(url)
    }
  }

  return (
    <Flex direction='column' gap='l'>
      <Text variant='heading'>{messages.bestOfAudius}</Text>
      <Flex
        wrap='wrap'
        gap='l'
        direction={isLarge ? 'column' : 'row'}
        justifyContent='space-between'
        css={
          !isLarge
            ? {
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr',
                gap: 'var(--harmony-spacing-l)',
                width: '100%'
              }
            : undefined
        }
      >
        {justForYouTiles.map((tile) => {
          const Icon = tile.icon
          return (
            <PerspectiveCard
              key={tile.title}
              backgroundGradient={tile.gradient}
              shadowColor={tile.shadow}
              backgroundIcon={
                Icon ? (
                  <Icon height={180} width={180} color='inverse' />
                ) : undefined
              }
              onClick={() => onClickCard(tile.link)}
              isIncentivized={!!tile.incentivized}
              sensitivity={tile.cardSensitivity}
            >
              <Flex w={'100%'} h={200}>
                <TextInterior title={tile.title} subtitle={tile.subtitle} />
              </Flex>
            </PerspectiveCard>
          )
        })}
      </Flex>
    </Flex>
  )
}
