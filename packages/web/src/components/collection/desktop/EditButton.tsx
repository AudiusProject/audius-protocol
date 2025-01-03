import { useGetCurrentUserId, useGetPlaylistById } from '@audius/common/api'
import { IconPencil, IconButton, IconButtonProps } from '@audius/harmony'
import { Link } from 'react-router-dom'

import { Tooltip } from 'components/tooltip'

const messages = {
  edit: (isAlbum: boolean) => `Edit ${isAlbum ? 'Album' : 'Playlist'}`
}

type EditButtonProps = Partial<IconButtonProps> & {
  collectionId: number
}

export const EditButton = (props: EditButtonProps) => {
  const { collectionId, ...other } = props
  const { data: currentUserId } = useGetCurrentUserId({})
  const { data: collection } = useGetPlaylistById({
    playlistId: collectionId,
    currentUserId
  })

  if (!collection) return null

  const { is_album, permalink } = collection

  return (
    <Tooltip text={messages.edit(is_album)}>
      <IconButton
        color='subdued'
        icon={IconPencil}
        size='2xl'
        aria-label={messages.edit(is_album)}
        asChild
        {...other}
      >
        <Link to={`${permalink}/edit`} />
      </IconButton>
    </Tooltip>
  )
}
