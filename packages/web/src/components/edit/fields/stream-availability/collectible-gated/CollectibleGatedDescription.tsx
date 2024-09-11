import { route } from '@audius/common/utils'
import {
  Box,
  Flex,
  Hint,
  IconExternalLink,
  IconQuestionCircle,
  PlainButton,
  Text
} from '@audius/harmony'

import { ExternalLink } from 'components/link'

const { AUDIUS_GATED_CONTENT_BLOG_LINK } = route

const messages = {
  collectibleGatedSubtitle:
    'Only fans who own a specific, digital collectible can play your track. (These tracks remain hidden from trending lists and user feeds.)',
  noCollectibles:
    'No Collectibles found. To enable this option, link a wallet containing a collectible.',
  learnMore: 'Learn More'
}

type CollectibleGatedDescriptionProps = {
  hasCollectibles: boolean
  isUpload: boolean
}

export const CollectibleGatedDescription = (
  props: CollectibleGatedDescriptionProps
) => {
  const { hasCollectibles, isUpload } = props

  const helpContent = !hasCollectibles ? messages.noCollectibles : null

  return (
    <Flex gap='xl' direction='column'>
      <Text variant='body'>{messages.collectibleGatedSubtitle}</Text>
      {!hasCollectibles && isUpload ? (
        <Hint icon={IconQuestionCircle}>{helpContent}</Hint>
      ) : null}
      <Box>
        <PlainButton iconRight={IconExternalLink} variant='subdued' asChild>
          <ExternalLink to={AUDIUS_GATED_CONTENT_BLOG_LINK}>
            {messages.learnMore}
          </ExternalLink>
        </PlainButton>
      </Box>
    </Flex>
  )
}
