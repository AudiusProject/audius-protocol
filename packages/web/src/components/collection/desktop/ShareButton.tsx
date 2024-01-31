import { shareModalUIActions } from '@audius/common/store'

import { useCallback } from 'react'

import {} from '@audius/common'
import { ShareSource, SmartCollectionVariant, ID } from '@audius/common/models'
import { ButtonProps, ButtonType, IconShare } from '@audius/stems'
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
