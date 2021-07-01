import React from 'react'

import { storiesOf } from '@storybook/react'

import EditTrackModal from 'components/track/EditTrackModal'
import GiantTrackTile from 'components/track/GiantTrackTile'
import TrackInfo from 'components/track/TrackInfo'
import PlaylistTile from 'components/track/desktop/PlaylistTile'
import TrackTile from 'components/track/desktop/TrackTile'
import MobileTrackList from 'components/track/mobile/TrackList'

const CenteredBackground = props => (
  <div
    style={{
      width: '100vw',
      height: '100vh',
      display: 'inline-flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#eff3f4',
      ...(props.styles || {})
    }}
  >
    {props.children}
  </div>
)

const mobileTracks = [
  {
    artistName: 'Purple Rayj',
    isDeleted: false,
    isSaved: false,
    trackTitle: 'boulevard-song',
    uid: 'kind:TRACKS-id:911-source:collection:306-count:0'
  },
  {
    artistName: 'Purple Rayj',
    isDeleted: false,
    isSaved: true,
    trackTitle: 'alishan-mountain',
    uid: 'kind:TRACKS-id:912-source:collection:306-count:0'
  },
  {
    artistName: 'Purple Rayj',
    isDeleted: true,
    isSaved: false,
    trackTitle: 'cadillac',
    uid: 'kind:TRACKS-id:913-source:collection:306-count:0'
  }
]

export default () => {
  return storiesOf('Track', module)
    .add('TrackInfo', () => (
      <TrackInfo trackTitle='Pink + White' artistName='Frank Ocean' />
    ))
    .add('TrackTile', () => (
      <TrackTile trackTitle='Pink + White' artistName='Frank Ocean' />
    ))
    .add('PlaylistTile', () => (
      <PlaylistTile playlistTitle='Shower songs' artistName='Bruce Wayne' />
    ))
    .add('GiantTrackTile', () => {
      return (
        <CenteredBackground>
          <GiantTrackTile
            trackTitle='Monophobia'
            artistName='deadmau5'
            tags={[
              'Audius-Exclusive',
              'Mau5Trap',
              'Deadmau5',
              'Electronic',
              'Hype',
              'Crypto',
              'Influencer'
            ]}
            description='Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas.'
            playing={false}
            loading={false}
          />
        </CenteredBackground>
      )
    })
    .add('EditTrackModal', () => <EditTrackModal />)
    .add('MobileTrackList', () => {
      return (
        <CenteredBackground>
          <MobileTrackList
            tracks={mobileTracks}
            trackTitle='Monophobia'
            artistName='deadmau5'
            tags={[
              'Audius-Exclusive',
              'Mau5Trap',
              'Deadmau5',
              'Electronic',
              'Hype',
              'Crypto',
              'Influencer'
            ]}
            description='Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas.'
            playing={false}
            loading={false}
          />
        </CenteredBackground>
      )
    })
}
