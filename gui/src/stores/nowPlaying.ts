import { useState } from 'react'
import { createContainer } from 'unstated-next'

type Whence = {
  title: string
  path: string
}

function useNowPlaying(initialState = undefined) {
  let [nowPlaying, setNowPlaying] = useState<any>(initialState)
  let [whence, setWhence] = useState<Whence>()
  let [implicitQueue, setImplicitQueue] = useState<any[]>([])
  let [playQueue, setPlayQueue] = useState<any[]>([])
  let [showQueue, setShowQueue] = useState(false)

  function isThisTrackPlaying({ id }: { id: string }) {
    return nowPlaying && nowPlaying.id == id
  }

  function addToQueue(track: any) {
    if (playQueue.includes(track)) {
      setPlayQueue(playQueue.filter((t) => t != track))
    } else {
      setPlayQueue([...playQueue, track])
    }
  }

  function toggleShowQueue() {
    setShowQueue(!showQueue)
  }

  function playNext() {
    if (playQueue.length) {
      const next = playQueue.shift()
      setPlayQueue([...playQueue])
      setNowPlaying(next)
    } else if (implicitQueue.length) {
      const idx = implicitQueue.indexOf(nowPlaying)
      const next = implicitQueue[idx + 1]
      setNowPlaying(next)
    } else {
      // reach out to API to get similar track and play that?
    }
  }

  return {
    nowPlaying,
    isThisTrackPlaying,
    setNowPlaying,
    playQueue,
    addToQueue,
    playNext,

    whence,
    setWhence,

    implicitQueue,
    setImplicitQueue,

    showQueue,
    toggleShowQueue,
  }
}

export const NowPlaying = createContainer(useNowPlaying)
