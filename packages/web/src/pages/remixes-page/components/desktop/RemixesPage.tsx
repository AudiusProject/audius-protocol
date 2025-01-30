import { Track, User } from '@audius/common/models'
import { pluralize } from '@audius/common/utils'
import { IconRemix, Text } from '@audius/harmony'

import { Header } from 'components/header/desktop/Header'
import {
  TanQueryLineup,
  TanQueryLineupProps
} from 'components/lineup/TanQueryLineup'
import { TrackLink } from 'components/link/TrackLink'
import { UserLink } from 'components/link/UserLink'
import Page from 'components/page/Page'
import { fullTrackRemixesPage } from 'utils/route'
import { withNullGuard } from 'utils/withNullGuard'

import styles from './RemixesPage.module.css'

const messages = {
  remixes: 'Remix',
  by: 'by',
  of: 'of',
  getDescription: (trackName: string, artistName: string) =>
    `${messages.remixes} ${messages.of} ${trackName} ${messages.by} ${artistName}`
}

export type RemixesPageProps = {
  title: string
  count: number | null
  originalTrack: Track | null
  user: User | null
  getLineupProps: () => TanQueryLineupProps
  goToTrackPage: () => void
  goToArtistPage: () => void
}

const g = withNullGuard(
  ({ originalTrack, user, ...p }: RemixesPageProps) =>
    originalTrack && user && { ...p, originalTrack, user }
)

const RemixesPage = g(
  ({ title, count = 0, originalTrack, user, getLineupProps }) => {
    const renderHeader = () => (
      <Header
        icon={IconRemix}
        primary={title}
        secondary={
          <Text variant='title' size='l' strength='weak'>
            {count} {pluralize(messages.remixes, count, 'es', !count)}{' '}
            {messages.of}{' '}
            <TrackLink trackId={originalTrack.track_id} variant='secondary' />{' '}
            {messages.by} <UserLink userId={user.user_id} variant='secondary' />
          </Text>
        }
        containerStyles={styles.header}
      />
    )

    const lineupProps = getLineupProps()

    return (
      <Page
        title={title}
        description={messages.getDescription(originalTrack.title, user.name)}
        canonicalUrl={fullTrackRemixesPage(originalTrack.permalink)}
        header={renderHeader()}
      >
        <TanQueryLineup {...lineupProps} />
      </Page>
    )
  }
)

export default RemixesPage
