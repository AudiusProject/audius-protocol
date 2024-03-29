import { useCallback } from 'react'

import { ShareSource, SmartCollectionVariant, ID } from '@audius/common/models'
import { shareModalUIActions } from '@audius/common/store'
import { ButtonProps, IconShare, Button } from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { Tooltip } from 'components/tooltip'

const { requestOpen: requestOpenShareModal } = shareModalUIActions

const messages = {
  share: 'Share'
}

type ShareButtonProps = Partial<ButtonProps> & {
  collectionId: SmartCollectionVariant | ID
  userId?: ID
  tooltipText?: string
}

export const ShareButton = (props: ShareButtonProps) => {
  const { collectionId, variant, userId, tooltipText, ...other } = props
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

  const shareButtonElement = (
    <Button
      variant={variant ?? 'secondary'}
      iconLeft={IconShare}
      onClick={handleShare}
      {...other}
    >
      {messages.share}
    </Button>
  )

  return tooltipText ? (
    <Tooltip text={tooltipText}>
      <span>{shareButtonElement}</span>
    </Tooltip>
  ) : (
    shareButtonElement
  )
}
