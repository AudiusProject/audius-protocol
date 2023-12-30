import { Ref, useCallback, useMemo } from 'react'

import { Name, cacheCollectionsActions } from '@audius/common'
import {
  HTMLButtonProps,
  IconCloudUpload,
  IconPlaylists
} from '@audius/harmony'
import { IconMultiselectAdd, PopupMenu, PopupMenuItem } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { useDispatch } from 'react-redux'

import IconUpload from 'assets/img/iconUpload.svg'
import { Tile } from 'components/tile'
import { track, make } from 'services/analytics'
import { UPLOAD_PAGE } from 'utils/route'

import styles from './UploadChip.module.css'
const { createAlbum, createPlaylist } = cacheCollectionsActions

const messages = {
  track: 'Upload Track',
  aTrack: 'Upload A Track',
  album: 'Upload New Album',
  playlist: 'Create Playlist',
  artistPlaylist: 'Upload New Playlist',
  firstAlbum: 'Upload Your First Album',
  firstPlaylist: 'Create Your First Playlist',
  firstArtistPlaylist: 'Upload Your First Playlist',
  uploadCollection: (collectionType: 'album' | 'playlist') =>
    `Upload ${collectionType}`,
  createCollection: (collectionType: 'album' | 'playlist') =>
    `Create ${collectionType}`
}

type UploadChipProps = {
  type?: 'track' | 'album' | 'playlist'
  /**
   * nav: For display in a nav-like column
   *
   * card: Looks like a 'Card'
   *
   * tile: Looks like a 'TrackTile'
   */
  variant?: 'nav' | 'card' | 'tile'
  /**
   * Is this upload the user's first of this type
   * */
  source: 'nav' | 'profile' | 'signup'
  isFirst?: boolean
  isArtist?: boolean
}

const UploadChip = ({
  type = 'track',
  variant = 'tile',
  isArtist = false,
  isFirst = false,
  source
}: UploadChipProps) => {
  const icon =
    type === 'track' || type === 'album' ? (
      <IconUpload className={styles.iconUpload} />
    ) : (
      <IconMultiselectAdd className={styles.iconPlus} />
    )

  let text: string
  switch (type) {
    case 'track':
      text = variant === 'nav' ? messages.track : messages.aTrack
      break
    case 'album':
      text = isFirst ? messages.firstAlbum : messages.album
      break
    case 'playlist':
      if (isArtist) {
        text = isFirst ? messages.firstArtistPlaylist : messages.artistPlaylist
      } else {
        text = isFirst ? messages.firstPlaylist : messages.playlist
      }
      break
    default:
      break
  }

  const dispatch = useDispatch()

  const handleClickUpload = useCallback(() => {
    dispatch(pushRoute(UPLOAD_PAGE))
    track(make({ eventName: Name.TRACK_UPLOAD_OPEN, source }))
  }, [dispatch, source])

  const handleCreateCollection = useCallback(() => {
    dispatch((type === 'album' ? createAlbum : createPlaylist)({}, source))
    // track(make({ eventName: , source }))
  }, [dispatch, source, type])

  const items: PopupMenuItem[] = useMemo(
    () =>
      type === 'track'
        ? []
        : [
            {
              text: messages.uploadCollection(type),
              icon: <IconCloudUpload />,
              onClick: handleClickUpload
            },
            {
              text: messages.createCollection(type),
              icon: <IconPlaylists />,
              onClick: handleCreateCollection
            }
          ],
    [type, handleClickUpload, handleCreateCollection]
  )

  const renderTile = (props: HTMLButtonProps, ref?: Ref<HTMLButtonElement>) => (
    <Tile
      className={cn(styles.root, {
        [styles.nav]: variant === 'nav',
        [styles.card]: variant === 'card',
        [styles.tile]: variant === 'tile'
      })}
      as='button'
      ref={ref}
      {...props}
    >
      <span>{icon}</span>
      <span className={styles.text}>{text}</span>
    </Tile>
  )

  return type === 'track' ? (
    renderTile({ onClick: handleClickUpload })
  ) : (
    <PopupMenu
      items={items}
      anchorOrigin={{ horizontal: 'right', vertical: 'center' }}
      transformOrigin={{ horizontal: 'center', vertical: 'center' }}
      renderTrigger={(anchorRef, onClick, triggerProps) =>
        renderTile({ onClick: () => onClick(), ...triggerProps }, anchorRef)
      }
    />
  )
}

export default UploadChip
