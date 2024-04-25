import { Collection } from '@audius/common/models'
import { EditPlaylistValues } from '@audius/common/store'
import { IconRocket, IconButton, IconButtonProps } from '@audius/harmony'
import { Formik } from 'formik'
import { useToggle } from 'react-use'

import { Tooltip } from 'components/tooltip'
import { AccessAndSaleField } from 'pages/upload-page/fields/AccessAndSaleField'

import { PublishConfirmationModal } from './PublishConfirmationModal'

const messages = {
  publish: 'Release Now',
  publishing: 'Releasing Now',
  emptyPlaylistTooltipText: 'You must add at least 1 song.'
}

type PublishButtonProps = {
  collection: Collection
  isAlbum?: boolean
} & Partial<IconButtonProps>

export const PublishButton = (props: PublishButtonProps) => {
  const { collection, isAlbum, ...other } = props
  const { track_count, _is_publishing } = collection

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
      <Formik
        initialValues={{
          ...(collection as EditPlaylistValues)
        }}
        onSubmit={() => { }}
      >
        {({ resetForm, values: formValues }) => (
          <>
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
              onMenuSubmit={(props) => {
                const { stream_availability_type } = props
                if (stream_availability_type !== 'HIDDEN') {
                  toggleIsConfirming()
                }
              }}
              isAlbum
            />
            <PublishConfirmationModal
              collectionFormValues={formValues}
              isOpen={isConfirming}
              onClose={() => {
                resetForm()
                toggleIsConfirming()
              }}
              onSubmit={toggleIsConfirming}
              isAlbum={isAlbum}
            />
          </>
        )}
      </Formik>
    </>
  )
}
