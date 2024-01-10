import { Ref, useCallback, useMemo } from 'react'

import {
  CreatePlaylistSource,
  FeatureFlags,
  Name,
  cacheCollectionsActions
} from '@audius/common'
import {
  Box,
  HTMLButtonProps,
  IconCloudUpload,
  IconPlaylists,
  IconPlus,
  Text
} from '@audius/harmony'
import { PopupMenu, PopupMenuItem } from '@audius/stems'
import cn from 'classnames'
import { push as pushRoute } from 'connected-react-router'
import { capitalize } from 'lodash'
import { useDispatch } from 'react-redux'

import IconUpload from 'assets/img/iconUpload.svg'
import { Tile } from 'components/tile'
import { useFlag } from 'hooks/useRemoteConfig'
import { track, make } from 'services/analytics'
import { UPLOAD_PAGE } from 'utils/route'

import styles from './UploadChip.module.css'
const { createAlbum, createPlaylist } = cacheCollectionsActions

const getMessages = (type: 'track' | 'album' | 'playlist') => ({
  track: 'Upload Track',
  aTrack: 'Upload A Track',
  createNewCollection: (isFirst: boolean) =>
    `Create ${isFirst ? 'Your First' : 'New'} ${capitalize(type)}`,
  uploadCollection: `Upload ${type}`,
  createCollection: `Create ${type}`
})

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
  source: 'nav' | 'profile' | CreatePlaylistSource
  isFirst?: boolean
}

const UploadChip = ({
  type = 'track',
  variant = 'tile',
  isFirst = false,
  source
}: UploadChipProps) => {
  const { isEnabled: isEditAlbumsEnabled } = useFlag(FeatureFlags.EDIT_ALBUMS)
  const messages = getMessages(type)
  const icon =
    type === 'track' ? (
      <IconUpload className={styles.iconUpload} />
    ) : (
      <IconPlus className={styles.iconPlus} color='subdued' />
    )

  let text: string
  switch (type) {
    case 'track':
      text = variant === 'nav' ? messages.track : messages.aTrack
      break
    case 'album':
    case 'playlist':
      text = messages.createNewCollection(isFirst)
      break
    default:
      break
  }

  const dispatch = useDispatch()

  const handleClickUpload = useCallback(() => {
    dispatch(pushRoute(UPLOAD_PAGE))
    track(
      make({
        eventName: Name.TRACK_UPLOAD_OPEN,
        source: source as 'nav' | 'profile'
      })
    )
  }, [dispatch, source])

  const handleCreateCollection = useCallback(() => {
    dispatch(
      (type === 'album' ? createAlbum : createPlaylist)(
        { playlist_name: `New ${type}` },
        source as CreatePlaylistSource,
        undefined,
        'route'
      )
    )
  }, [dispatch, source, type])

  const items: PopupMenuItem[] = useMemo(
    () =>
      type === 'track'
        ? []
        : [
            {
              text: messages.uploadCollection,
              icon: <IconCloudUpload />,
              onClick: handleClickUpload
            },
            {
              text: messages.createCollection,
              icon: <IconPlaylists />,
              onClick: handleCreateCollection
            }
          ],
    [type, messages, handleClickUpload, handleCreateCollection]
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
      <Box w={variant === 'card' ? 100 : 'auto'}>
        <Text variant='title' size='m' color='subdued' strength='default'>
          {text}
        </Text>
      </Box>
    </Tile>
  )

  return !isEditAlbumsEnabled || type === 'track' ? (
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
