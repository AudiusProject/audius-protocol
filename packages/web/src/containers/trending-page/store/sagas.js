import trendingSagas from './lineups/trending/sagas.js'

export default function sagas() {
  return [...trendingSagas()]
}
