/**
 * Helpers to pull important information off of a queue object.
 */

/**
 * Gets the track object for the current track in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentTrack(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].track
}

/**
 * Gets the track object itself (i.e. metadata) for the current track in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentTrackMetadata(queue) {
  if (queue.playingIndex === -1) {
    return null
  }

  const track = queue.queue[queue.playingIndex].track
  return track ? track.metadata : null
}

/**
 * Gets the Howler.js object for the current track in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentTrackHowl(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].track.audio.currentSegment()
}

/**
 * Gets the HTML5 audio element for the current track in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?Object}
 */
export function getCurrentTrackAudioElement(queue) {
  if (
    queue.playingIndex === -1 ||
    !queue.queue[queue.playingIndex].track ||
    !queue.queue[queue.playingIndex].track.audio
  ) {
    return null
  }
  return queue.queue[queue.playingIndex].track.audio.currentAudioElement()
}

/**
 * Gets the song duration (seconds) for the current track in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?number}
 */
export function getCurrentTrackDuration(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].track.audio.getDuration()
}

/**
 * Gets the current playback position (seconds) for the current track in the queue.
 * @param {Object} queue the queue redux store object.
 * @returns {?number}
 */
export function getCurrentTrackPosition(queue) {
  if (queue.playingIndex === -1) {
    return null
  }
  return queue.queue[queue.playingIndex].position
}

/**
 * Returns whether or not the queue is playing.
 * @param {Object} queue the queue redux store object.
 * @returns {?boolean}
 */
export function isPlaying(queue) {
  return queue.playing
}
