import { pluralize } from '@audius/common/utils'

export const messages = {
  artistPick: 'Artist Pick',
  coSign: 'Co-Sign',
  favorited: 'Favorited',
  getPlays: (listenCount: number) => ` ${pluralize('Play', listenCount)}`,
  hiddenTrack: 'Hidden Track',
  played: 'Played',
  reposted: 'Reposted',
  repostedAndFavorited: 'Reposted & Favorited',
  timeLeft: 'left'
}
