import tracksSagas from './lineups/tracks/sagas'

export default function sagas() {
  return [...tracksSagas()]
}
