import { describe, it, expect } from 'vitest'

import { QueueSource } from '../queue'

import queueReducer, { actions } from './slice'
import { RepeatMode } from './types'

describe('queue slice shuffle mode', () => {
  it('should not include current track in shuffle order when shuffle is enabled', () => {
    // Setup initial state with tracks
    const initialState = {
      order: [
        { uid: 'track1', id: 1, source: QueueSource.TRACK_TRACKS },
        { uid: 'track2', id: 2, source: QueueSource.TRACK_TRACKS },
        { uid: 'track3', id: 3, source: QueueSource.TRACK_TRACKS }
      ],
      positions: { track1: 0, track2: 1, track3: 2 },
      index: 0, // Currently playing first track
      repeat: RepeatMode.OFF,
      shuffle: false,
      shuffleIndex: -1,
      shuffleOrder: [],
      overshot: false,
      undershot: false
    }

    // Enable shuffle mode
    const stateAfterShuffle = queueReducer(
      initialState,
      actions.shuffle({ enable: true })
    )

    // The shuffle order should start with the current track (index 0)
    expect(stateAfterShuffle.shuffleOrder[0]).toBe(0)

    // The remaining tracks should be shuffled and not include the current track again
    const remainingTracks = stateAfterShuffle.shuffleOrder.slice(1)
    expect(remainingTracks).toHaveLength(2)
    expect(remainingTracks).toContain(1)
    expect(remainingTracks).toContain(2)
    expect(remainingTracks).not.toContain(0) // Current track should not appear again
  })

  it('should handle next correctly in shuffle mode', () => {
    // Setup state with shuffle enabled
    const initialState = {
      order: [
        { uid: 'track1', id: 1, source: QueueSource.TRACK_TRACKS },
        { uid: 'track2', id: 2, source: QueueSource.TRACK_TRACKS },
        { uid: 'track3', id: 3, source: QueueSource.TRACK_TRACKS }
      ],
      positions: { track1: 0, track2: 1, track3: 2 },
      index: 0,
      repeat: RepeatMode.OFF,
      shuffle: true,
      shuffleIndex: 0,
      shuffleOrder: [0, 2, 1], // Current track first, then shuffled others
      overshot: false,
      undershot: false
    }

    // Call next
    const stateAfterNext = queueReducer(initialState, actions.next({}))

    // Should move to the next track in shuffle order (index 2)
    expect(stateAfterNext.index).toBe(2)
    expect(stateAfterNext.shuffleIndex).toBe(1)
  })

  it('should loop back to beginning when reaching the end in repeat all mode', () => {
    // Setup state with shuffle enabled and repeat all
    const initialState = {
      order: [
        { uid: 'track1', id: 1, source: QueueSource.TRACK_TRACKS },
        { uid: 'track2', id: 2, source: QueueSource.TRACK_TRACKS },
        { uid: 'track3', id: 3, source: QueueSource.TRACK_TRACKS }
      ],
      positions: { track1: 0, track2: 1, track3: 2 },
      index: 1, // Currently playing second track
      repeat: RepeatMode.ALL,
      shuffle: true,
      shuffleIndex: 2, // At the end of shuffle order
      shuffleOrder: [1, 0, 2], // Current track first, then shuffled others
      overshot: false,
      undershot: false
    }

    // Call next to trigger loop back to beginning
    const stateAfterNext = queueReducer(initialState, actions.next({}))

    // Should loop back to beginning of shuffle order
    expect(stateAfterNext.shuffleIndex).toBe(0)
    expect(stateAfterNext.index).toBe(1) // Should play the first track in shuffle order
    expect(stateAfterNext.shuffleOrder).toEqual([1, 0, 2]) // Shuffle order should remain the same
  })

  it('should update shuffle order when playing a specific track in shuffle mode', () => {
    // Setup state with shuffle enabled
    const initialState = {
      order: [
        { uid: 'track1', id: 1, source: QueueSource.TRACK_TRACKS },
        { uid: 'track2', id: 2, source: QueueSource.TRACK_TRACKS },
        { uid: 'track3', id: 3, source: QueueSource.TRACK_TRACKS }
      ],
      positions: { track1: 0, track2: 1, track3: 2 },
      index: 0, // Currently playing first track
      repeat: RepeatMode.OFF,
      shuffle: true,
      shuffleIndex: 0,
      shuffleOrder: [0, 2, 1], // Current shuffle order
      overshot: false,
      undershot: false
    }

    // Play a different track (track2)
    const stateAfterPlay = queueReducer(
      initialState,
      actions.play({ uid: 'track2' })
    )

    // Should update to play track2 (index 1)
    expect(stateAfterPlay.index).toBe(1)

    // Should regenerate shuffle order with track2 first
    expect(stateAfterPlay.shuffleOrder[0]).toBe(1) // track2 should be first
    expect(stateAfterPlay.shuffleIndex).toBe(0)

    // Other tracks should be shuffled after track2
    const remainingTracks = stateAfterPlay.shuffleOrder.slice(1)
    expect(remainingTracks).toHaveLength(2)
    expect(remainingTracks).toContain(0) // track1
    expect(remainingTracks).toContain(2) // track3
    expect(remainingTracks).not.toContain(1) // track2 should not appear again
  })
})
