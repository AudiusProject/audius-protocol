import { UnstyledButton } from '@mantine/core'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { PlayerPause, PlayerPlay } from 'tabler-icons-react'
import { NowPlaying } from '../stores/nowPlaying'
import { LinkTo } from './LinkTo'

// TODO: should be some minimal definition of track
// both in typescript and as a fragment
type PlayButtonTrack = {
  id: string
  title: string
  cover_art_urls: string[]
  stream_urls: string[]

  owner: {
    id: string
    name?: string
    handle: string
  }
}

// Play button
type PlayButtonProps = {
  track: PlayButtonTrack

  // track list containing played track
  // used for implicit queue when current track ends
  trackList?: PlayButtonTrack[]
}

export function PlayButton({ track, trackList }: PlayButtonProps) {
  const location = useLocation()
  const { isThisTrackPlaying, setNowPlaying, setImplicitQueue, setWhence } =
    NowPlaying.useContainer()

  function onPlay() {
    // TODO: this "mostly" works for capturing from whence the play button was clicked...
    // but breaks in the context of the PlayQueue drawer...
    // either whence should be a prop for PlayButton
    // or there should be some kind of noWhence prop
    console.log('whence', location)
    setWhence({
      title: document.title,
      path: location.pathname,
    })
    setNowPlaying(track)
    if (trackList) setImplicitQueue(trackList)
  }

  if (isThisTrackPlaying(track)) {
    return (
      <UnstyledButton onClick={() => setNowPlaying(undefined)}>
        <PlayerPause />
      </UnstyledButton>
    )
  }
  return (
    <UnstyledButton onClick={onPlay}>
      <PlayerPlay />
    </UnstyledButton>
  )
}

// Play bar at bottom
export function PlayerUI() {
  const audioEl = useRef<HTMLAudioElement>(null)
  const { nowPlaying, playNext } = NowPlaying.useContainer()

  function onTrackEnded() {
    console.log('song ended... attempting to playing next')
    playNext()
  }

  useEffect(() => {
    audioEl.current?.addEventListener('ended', onTrackEnded)
    return () => {
      audioEl.current?.removeEventListener('ended', onTrackEnded)
    }
  })

  if (!nowPlaying) return null

  const track = nowPlaying
  const src = nowPlaying.stream_urls[0]

  return (
    <div style={{ height: 100 }}>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          width: '100%',
          background: 'white',
          borderTop: '2px solid black',
          padding: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* <ImgBox src={track.cover_art_urls} size={50} /> */}

          <div style={{ marginLeft: 30, marginRight: 30 }}>
            <LinkTo item={track}>
              <b className="font-black">{nowPlaying.title}</b>
            </LinkTo>
            <br />
            <LinkTo item={track.owner}>
              <span className="">{track.owner.name}</span>
            </LinkTo>
          </div>

          <audio
            ref={audioEl}
            controls
            src={src}
            autoPlay={true}
            style={{ flexGrow: 1 }}
            controlsList="nodownload"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    </div>
  )
}
