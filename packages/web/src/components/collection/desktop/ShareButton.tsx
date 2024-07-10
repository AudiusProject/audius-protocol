import { useCallback } from 'react'

import { ShareSource, SmartCollectionVariant, ID } from '@audius/common/models'
import { shareModalUIActions } from '@audius/common/store'
import { IconShare, IconButton, IconButtonProps } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { Tooltip } from 'components/tooltip'

const { requestOpen: requestOpenShareModal } = shareModalUIActions

const messages = {
  share: 'Share'
}

type ShareButtonProps = Partial<IconButtonProps> & {
  collectionId: SmartCollectionVariant | ID
  userId?: ID | null
  tooltipText?: string
}

export const ShareButton = (props: ShareButtonProps) => {
  const { collectionId, userId, tooltipText, ...other } = props
  const dispatch = useDispatch()

  const handleShare = useCallback(() => {
    if (typeof collectionId !== 'number') {
      if (
        collectionId === SmartCollectionVariant.AUDIO_NFT_PLAYLIST &&
        userId
      ) {
        dispatch(
          requestOpenShareModal({
            type: 'audioNftPlaylist',
            userId,
            source: ShareSource.PAGE
          })
        )
      }
    } else {
      dispatch(
        requestOpenShareModal({
          type: 'collection',
          collectionId,
          source: ShareSource.PAGE
        })
      )
    }
  }, [dispatch, collectionId, userId])

  const buttonRender = (
    <IconButton
      icon={IconShare}
      onClick={handleShare}
      size='l'
      color='subdued'
      aria-label={messages.share}
      {...other}
    />
  )

  return (
    <Tooltip text={tooltipText ?? messages.share}>
      <span>{buttonRender}</span>
    </Tooltip>
  )
}
