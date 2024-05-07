import {
  Flex,
  Hint,
  IconExternalLink,
  IconQuestionCircle,
  Text
} from '@audius/harmony'

import { ExternalTextLink } from 'components/link'
import { AUDIUS_GATED_CONTENT_BLOG_LINK } from 'utils/route'

const messages = {
  collectibleGatedSubtitle:
    'Users who own a digital collectible matching your selection will have access to your track. Collectible gated content does not appear on trending or in user feeds.',
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
      <ExternalTextLink to={AUDIUS_GATED_CONTENT_BLOG_LINK} textVariant='body'>
        {messages.learnMore} <IconExternalLink size='s' color='default' />
      </ExternalTextLink>
    </Flex>
  )
}
