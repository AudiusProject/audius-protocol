import { useCurrentCommentSection } from '@audius/common/context'
import { useGatedContentAccess } from '@audius/common/hooks'
import { ModalSource } from '@audius/common/models'
import {
  playerActions,
  PurchaseableContentType,
  trackPageLineupActions,
  trackPageSelectors,
  usePremiumContentPurchaseModal
} from '@audius/common/store'
import { formatTrackTimestamp, TextLink, TextLinkProps } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

const { tracksActions } = trackPageLineupActions
const { getLineup } = trackPageSelectors
const { seek } = playerActions

type TimestampLinkProps = {
  timestampSeconds: number
} & TextLinkProps

export const TimestampLink = (props: TimestampLinkProps) => {
  const { timestampSeconds, ...other } = props

  const dispatch = useDispatch()
  const { track } = useCurrentCommentSection()
  const lineup = useSelector(getLineup)
  const { track_id: trackId } = track

  const { hasStreamAccess } = useGatedContentAccess(track)

  const uid = lineup?.entries?.[0]?.uid
  const { onOpen: openPremiumContentPurchaseModal } =
    usePremiumContentPurchaseModal()

  return (
    <TextLink
      onClick={() => {
        if (!hasStreamAccess) {
          openPremiumContentPurchaseModal(
            { contentId: trackId, contentType: PurchaseableContentType.TRACK },
            {
              source: ModalSource.Comment
            }
          )
        } else {
          dispatch(tracksActions.play(uid))
          setTimeout(() => {
            dispatch(seek({ seconds: timestampSeconds }))
          })
        }
      }}
      variant='visible'
      size='s'
      {...other}
    >
      {formatTrackTimestamp(timestampSeconds)}
    </TextLink>
  )
}
