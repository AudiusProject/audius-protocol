import trendingSagas from './lineups/trending/sagas'

export default function sagas() {
  return [...trendingSagas()]
}
