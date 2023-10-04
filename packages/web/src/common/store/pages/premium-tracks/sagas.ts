import premiumTracksSagas from './lineups/tracks/sagas'

export default function sagas() {
  return [...premiumTracksSagas()]
}
