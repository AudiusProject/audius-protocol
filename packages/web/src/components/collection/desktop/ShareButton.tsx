import { useCallback } from 'react'

import {
  ID,
  shareModalUIActions,
  ShareSource,
  SmartCollectionVariant
} from '@audius/common'
import { ButtonProps, ButtonType, IconShare } from '@audius/stems'
import { useDispatch } from 'react-redux'

import { Tooltip } from 'components/tooltip'

import { CollectionActionButton } from './CollectionActionButton'
import { BUTTON_COLLAPSE_WIDTHS } from './utils'

const { requestOpen: requestOpenShareModal } = shareModalUIActions

const messages = {
  share: 'Share',
  emptyPlaylistTooltipText: 'You can’t share an empty playlist.'
}

type ShareButtonProps = Partial<ButtonProps> & {
  collectionId: SmartCollectionVariant | ID
  userId?: ID
}

export const ShareButton = (props: ShareButtonProps) => {
  const { collectionId, type, userId, ...other } = props
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
    <CollectionActionButton
      type={type ?? ButtonType.COMMON}
      text={messages.share}
      leftIcon={<IconShare />}
      widthToHideText={BUTTON_COLLAPSE_WIDTHS.second}
      onClick={handleShare}
      {...other}
    />
  )

  return other.disabled ? (
    <Tooltip text={messages.emptyPlaylistTooltipText}>
      <span>{shareButtonElement}</span>
    </Tooltip>
  ) : (
    shareButtonElement
  )
}
