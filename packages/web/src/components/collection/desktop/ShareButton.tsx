import { useCallback } from 'react'

import {
  ID,
  shareModalUIActions,
  ShareSource,
  SmartCollectionVariant
} from '@audius/common'
import { IconShare } from '@audius/harmony'
import { ButtonProps, ButtonType } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { Tooltip } from 'components/tooltip'

import { EntityActionButton } from '../../entity-page/EntityActionButton'

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
  const { collectionId, type, userId, tooltipText, ...other } = props
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
    <EntityActionButton
      type={type ?? ButtonType.COMMON}
      text={messages.share}
      leftIcon={<IconShare />}
      onClick={handleShare}
      {...other}
    />
  )

  return tooltipText ? (
    <Tooltip text={tooltipText}>
      <span>{shareButtonElement}</span>
    </Tooltip>
  ) : (
    shareButtonElement
  )
}
