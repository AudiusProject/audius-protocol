import { collectiblesSelectors } from '@audius/common/store'
import { Flex, IconExternalLink, Text } from '@audius/harmony'
import { Button, ButtonType } from '@audius/stems'
import { useSelector } from 'react-redux'

import { HelpCallout } from 'components/help-callout/HelpCallout'
import { ExternalLink } from 'components/link'
import { AUDIUS_GATED_CONTENT_BLOG_LINK } from 'utils/route'

const { getHasUnsupportedCollection } = collectiblesSelectors
const messages = {
  collectibleGatedSubtitle:
    'Users who own a digital collectible matching your selection will have access to your track. Collectible gated content does not appear on trending or in user feeds.',
  noCollectibles:
    'No Collectibles found. To enable this option, link a wallet containing a collectible.',
  compatibilityTitle: "Not seeing what you're looking for?",
  compatibilitySubtitle:
    'Unverified Solana NFT Collections are not compatible at this time.',
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
  const hasUnsupportedCollection = useSelector(getHasUnsupportedCollection)

  const helpContent = hasUnsupportedCollection ? (
    <div>
      <div>{messages.compatibilityTitle}</div>
      <div>{messages.compatibilitySubtitle}</div>
    </div>
  ) : (
    messages.noCollectibles
  )

  return (
    <Flex gap='xl' direction='column'>
      <Text variant='body'>{messages.collectibleGatedSubtitle}</Text>
      {!hasCollectibles && isUpload ? (
        <HelpCallout content={helpContent} />
      ) : null}
      <ExternalLink to={AUDIUS_GATED_CONTENT_BLOG_LINK} textVariant='body'>
        {messages.learnMore} <IconExternalLink size='s' color='default' />
      </ExternalLink>
    </Flex>
  )
}
