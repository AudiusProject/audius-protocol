import { useGetTrackById } from '@audius/common/api'
import { trackPageMessages as messages } from '@audius/common/messages'
import { ID } from '@audius/common/models'
import { Button, ButtonProps, IconArrowRight } from '@audius/harmony'
import { Link } from 'react-router-dom-v5-compat'

import { trackRemixesPage } from 'utils/route'

type ViewOtherRemixesButtonProps = {
  parentTrackId: ID
} & ButtonProps

export const ViewOtherRemixesButton = (props: ViewOtherRemixesButtonProps) => {
  const { parentTrackId, ...buttonProps } = props

  const { data: parentTrack } = useGetTrackById({ id: parentTrackId })

  const remixesRoute = trackRemixesPage(parentTrack?.permalink ?? '')

  return (
    <Button iconRight={IconArrowRight} asChild {...buttonProps}>
      <Link to={remixesRoute}>{messages.viewOtherRemixes}</Link>
    </Button>
  )
}
