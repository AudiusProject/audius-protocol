import { AccessConditions, Collection, ID } from '@audius/common/models'
import { IconRocket, IconButton, IconButtonProps } from '@audius/harmony'
import { Formik } from 'formik'
import { useToggle } from 'react-use'
import { Nullable } from 'vitest'

import { Tooltip } from 'components/tooltip'
import { AccessAndSaleField } from 'pages/upload-page/fields/AccessAndSaleField'
import { IS_UNLISTED, STREAM_CONDITIONS } from 'pages/upload-page/fields/types'

import { PublishConfirmationModal } from './PublishConfirmationModal'

const messages = {
  publish: 'Make Public',
  publishing: 'Making Public',
  emptyPlaylistTooltipText: 'You must add at least 1 song.'
}

type PublishButtonProps = { collectionId: ID } & Partial<IconButtonProps> &
  Pick<
    Collection,
    | '_is_publishing'
    | 'track_count'
    | 'is_private'
    | 'stream_conditions'
    // | 'trackMetadatasIndex'
    | 'tracks'
    // | 'is_scheduled_release'
    | 'is_stream_gated'
  >

export const PublishButton = (props: PublishButtonProps) => {
  const {
    collectionId,
    track_count,
    _is_publishing,
    stream_conditions,
    is_private,
    tracks,
    ...other
  } = props

  const [isConfirming, toggleIsConfirming] = useToggle(false)

  const isDisabled = !track_count || track_count === 0

  const publishButton = (toggleMenu: () => void) => (
    <IconButton
      icon={IconRocket}
      onClick={toggleMenu}
      disabled={isDisabled || _is_publishing}
      color='subdued'
      aria-label={_is_publishing ? messages.publishing : messages.publish}
      {...other}
    />
  )

  return (
    <>
      <PublishConfirmationModal
        collectionId={collectionId}
        isOpen={isConfirming}
        onClose={toggleIsConfirming}
      />
      <Formik
        initialValues={{
          stream_conditions,
          trackMetadatasIndex: 0,
          is_private
        }}
        onSubmit={() => {
          toggleIsConfirming()
        }}
      >
        <AccessAndSaleField
          previewOverride={(toggleMenu) => (
            <>
              {track_count === 0 ? (
                <Tooltip text={messages.emptyPlaylistTooltipText}>
                  <span>{publishButton(toggleMenu)}</span>
                </Tooltip>
              ) : (
                publishButton(toggleMenu)
              )}
            </>
          )}
          isAlbum
        />
      </Formik>
    </>
  )
}
