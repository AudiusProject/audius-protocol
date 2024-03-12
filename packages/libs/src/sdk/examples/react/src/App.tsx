import { MouseEventHandler, useEffect, useRef, useState } from 'react'
import { sdk, full as FullSdk } from '@audius/sdk'
import {
  ThemeProvider as HarmonyThemeProvider,
  Hint,
  IconInfo,
  IconPause,
  IconPlay,
  Paper,
  Text,
  TextInput
} from '@audius/harmony'
import { Button, Flex } from '@audius/harmony'
import { css } from '@emotion/react'

type User = { userId: string; handle: string }

const audiusSdk = sdk({
  appName: 'Audius SDK React Example'
  // apiKey: "Your API Key goes here",
  // apiSecret: "Your API Secret goes here",
  // NOTE: In a real app, you should never expose your apiSecret to the client.
  // Instead, store the apiSecret on your server and make requests using @audius/sdk server side
})

function App() {
  const [tracks, setTracks] = useState<FullSdk.TrackFull[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [streamSrcs, setStreamSrcs] = useState<Record<string, string>>({})
  const [playingTrackId, setPlayingTrackId] = useState<string | null>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const audioRef = useRef<HTMLAudioElement>(null)
  const handleInputRef = useRef<HTMLInputElement>(null)
  const loginWithAudiusButtonRef = useRef<HTMLDivElement>(null)

  /**
   * Init @audius/sdk oauth
   */
  useEffect(() => {
    audiusSdk.oauth?.init({
      successCallback: (user: User) => setUser(user),
      errorCallback: (error: Error) => console.log('Got error', error)
    })

    audiusSdk.oauth?.renderButton({
      element: loginWithAudiusButtonRef.current!,
      scope: 'write'
    })
  }, [])

  /**
   * Fetch tracks based on the user handle present in handleInputRef
   * Update favorites state with the results of the fetch
   */
  const fetchTrack = async () => {
    const { data: selectedUser } = await audiusSdk.users.getUserByHandle({
      handle: handleInputRef.current?.value ?? ''
    })

    const { data: tracks } = await audiusSdk.full.users.getTracksByUser({
      id: selectedUser?.id ?? '',
      userId: user?.userId ?? ''
    })
    setTracks(tracks ?? [])

    const trackFavorites = (tracks ?? []).reduce<Record<string, boolean>>(
      (result, track) => ({
        ...result,
        [track.id]: track.hasCurrentUserSaved
      }),
      {}
    )

    setFavorites(trackFavorites)
  }

  /**
   * Set the streamUrl for the audio player based on the clicked track
   */
  const streamTrack = async (trackId: string) => {
    const fetchTrackStreamUrl = async () => {
      const streamUrl = await audiusSdk.tracks.streamTrack({ trackId })
      setStreamSrcs((prev) => ({ ...prev, [trackId]: streamUrl }))
      return streamUrl
    }

    if (!streamSrcs[trackId]) {
      await fetchTrackStreamUrl()
    }

    if (trackId === playingTrackId) {
      setIsPlaying((prev) => !prev)
    } else {
      setPlayingTrackId(trackId)
      setIsPlaying(true)
    }
  }

  /**
   * Favorite a track. This requires a user to be authenticated and granted
   * write permissions to the app
   */
  const favoriteTrack =
    (trackId: string): MouseEventHandler<HTMLButtonElement> =>
    async (e) => {
      e.stopPropagation()
      if (user) {
        setFavorites((prev) => ({ ...prev, [trackId]: true }))
        try {
          await audiusSdk.tracks.favoriteTrack({ userId: user.userId, trackId })
        } catch (e) {
          console.error('Failed to favorite track', e)
          setFavorites((prev) => ({ ...prev, [trackId]: false }))
        }
      } else {
        alert('Please log in with Audius to perform write operations')
      }
    }

  useEffect(() => {
    if (isPlaying && audioRef.current?.src) {
      audioRef.current?.play()
    } else {
      audioRef.current?.pause()
    }
  }, [isPlaying])

  return (
    <HarmonyThemeProvider theme='day'>
      <Flex direction='column' gap='m' m='2xl' alignItems='center'>
        <Flex direction='column'>
          <Text color='heading' strength='strong' variant='display'>
            React + @audius/sdk
          </Text>
          <h2>
            <Text color='accent' variant='heading'>
              Stream and favorite tracks!
            </Text>
          </h2>
        </Flex>
        {!user ? (
          <Hint
            icon={() => <IconInfo size='l' color='default' />}
            m='m'
            css={{ maxWidth: 400 }}
          >
            <Flex gap='m' direction='column'>
              <Text>
                To perform writes with @audius/sdk please authorize this app to
                perform writes on your behalf
              </Text>
              <div ref={loginWithAudiusButtonRef} />
            </Flex>
          </Hint>
        ) : null}
        <Flex direction='column' gap='s'>
          <Text>Enter a user handle to fetch their tracks:</Text>
          <Flex gap='m'>
            <TextInput
              label='Get tracks for user handle:'
              size={'small' as any}
              defaultValue={'RAC'}
              ref={handleInputRef}
            />
            <Button size='small' onClick={fetchTrack}>
              Get tracks
            </Button>
          </Flex>
        </Flex>
        {tracks.map((track) => (
          <Paper
            m='m'
            key={track.id}
            onClick={() => streamTrack(track.id)}
            css={{ width: 400 }}
          >
            <Flex
              css={css`
                position: relative;
                cursor: pointer;
                &:hover {
                  > svg {
                    display: block;
                  }
                }
              `}
            >
              <img
                src={track.artwork?.['_150x150']}
                alt={track.title}
                css={{ height: '100%' }}
              />
              {!isPlaying || track.id !== playingTrackId ? (
                <IconPlay
                  size='3xl'
                  opacity={0.8}
                  color='staticWhite'
                  css={{
                    display: 'none',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-45%, -50%)'
                  }}
                />
              ) : (
                <IconPause
                  size='3xl'
                  opacity={0.8}
                  color='staticWhite'
                  css={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-45%, -50%)'
                  }}
                />
              )}
            </Flex>
            <Flex direction='column' m='m' gap='s' css={{ width: '100%' }}>
              <Text>{track.title}</Text>
              <Text>{track.user.name}</Text>
              {!favorites[track.id] ? (
                <Button
                  fullWidth={true}
                  onClick={favoriteTrack(track.id)}
                  size='small'
                >
                  Favorite
                </Button>
              ) : (
                <Text>Favorited</Text>
              )}
            </Flex>
          </Paper>
        ))}
      </Flex>
      <audio
        css={{ display: 'none' }}
        src={playingTrackId ? streamSrcs[playingTrackId] : undefined}
        ref={audioRef}
        autoPlay
      />
    </HarmonyThemeProvider>
  )
}

export default App
