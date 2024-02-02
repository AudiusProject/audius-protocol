import tracksSagas from './lineups/sagas'

export default function sagas() {
  return [...tracksSagas()]
}
