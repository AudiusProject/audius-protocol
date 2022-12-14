import TrackPlayer from 'react-native-track-player'

module.exports = async () => {
  TrackPlayer.addEventListener('remote-play', () => {})
  TrackPlayer.addEventListener('remote-pause', () => {})
  TrackPlayer.addEventListener('remote-next', () => {})
  TrackPlayer.addEventListener('remote-previous', () => {})
  TrackPlayer.addEventListener('remote-stop', () => {})
}
