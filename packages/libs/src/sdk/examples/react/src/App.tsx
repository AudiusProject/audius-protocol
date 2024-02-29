import { MouseEventHandler, useEffect, useRef, useState } from 'react'
import './App.css'
import { sdk, full as FullSdk } from '@audius/sdk'
import { ThemeProvider as HarmonyThemeProvider } from '@audius/harmony'
import { Button, Flex } from '@audius/harmony'

const audiusSdk = sdk({
  appName: 'Audius SDK React Example'
  // apiKey: "Your API Key goes here",
  // apiSecret: "Your API Secret goes here",
  // NOTE: In a real app, you should never expose your apiSecret to the client.
  // Instead, store the apiSecret on your server and make requests using @audius/sdk server side
})

function App() {
  const [tracks, setTracks] = useState<FullSdk.TrackFull[]>([])
  const [user, setUser] = useState<{ userId: string; handle: string } | null>(
    null
  )
  const [streamSrc, setStreamSrc] = useState<string>('')
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const handleInputRef = useRef<HTMLInputElement>(null)
  const loginWithAudiusButtonRef = useRef<HTMLDivElement>(null)

  /**
   * Init @audius/sdk oauth
   */
  useEffect(() => {
    audiusSdk.oauth?.init({
      successCallback: (user) => setUser(user),
      errorCallback: (error) => console.log('Got error', error)
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

    // const trackFavorites = (tracks ?? []).reduce<Record<string, boolean>>(
    //   (result, track) => ({
    //     ...result,
    //     [track.id]: track.hasCurrentUserSaved
    //   }),
    //   {}
    // )

    // setFavorites(trackFavorites)
  }

  /**
   * Set the streamUrl for the audio player based on the clicked track
   */
  const streamTrack = async (trackId: string) => {
    const streamUrl = await audiusSdk.tracks.streamTrack({ trackId })
    setStreamSrc(streamUrl)
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

  return (
    <HarmonyThemeProvider theme='day'>
      <Flex>
        <h1>React + @audius/sdk</h1>
        <h2>Stream and favorite tracks!</h2>
      </Flex>
      <div ref={loginWithAudiusButtonRef} />
      <div className='card' style={{ display: 'flex', gap: '16px' }}>
        <label>
          Get tracks for user handle:
          <input type='text' defaultValue={'skrillex'} ref={handleInputRef} />
        </label>
        <Button onClick={fetchTrack}>Get tracks</Button>
      </div>
      <audio controls src={streamSrc} autoPlay />
      <div className='card'>
        {tracks.map((track) => (
          <div
            key={track.id}
            style={{ display: 'flex' }}
            onClick={() => streamTrack(track.id)}
          >
            <img src={track.artwork?.['_150x150']} alt={track.title} />
            <div>
              <h3>{track.title}</h3>
              {!favorites[track.id] ? (
                <button onClick={favoriteTrack(track.id)}>Favorite</button>
              ) : (
                <p>Favorited</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </HarmonyThemeProvider>
  )
}

export default App
