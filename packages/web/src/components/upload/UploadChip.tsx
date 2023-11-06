import { IconMultiselectAdd } from '@audius/stems'
import cn from 'classnames'

import IconUpload from 'assets/img/iconUpload.svg'
import { Tile } from 'components/tile'

import styles from './UploadChip.module.css'

const messages = {
  track: 'Upload Track',
  aTrack: 'Upload A Track',
  album: 'Upload New Album',
  playlist: 'Create Playlist',
  artistPlaylist: 'Upload New Playlist',
  firstAlbum: 'Upload Your First Album',
  firstPlaylist: 'Create Your First Playlist',
  firstArtistPlaylist: 'Upload Your First Playlist'
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
  isFirst?: boolean
  onClick: () => void
  isArtist?: boolean
}

const UploadChip = ({
  type = 'track',
  variant = 'tile',
  isArtist = false,
  isFirst = false,
  onClick
}: UploadChipProps) => {
  const icon =
    type === 'track' || type === 'album' ? (
      <IconUpload className={styles.iconUpload} />
    ) : (
      <IconMultiselectAdd className={styles.iconPlus} />
    )

  let text
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

  return (
    <Tile
      className={cn(styles.root, {
        [styles.nav]: variant === 'nav',
        [styles.card]: variant === 'card',
        [styles.tile]: variant === 'tile'
      })}
      as='button'
      onClick={onClick}
    >
      <span>{icon}</span>
      <span className={styles.text}>{text}</span>
    </Tile>
  )
}

export default UploadChip
