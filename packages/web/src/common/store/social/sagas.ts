import collectionsSagas from './collections/sagas'
import tracksSagas from './tracks/sagas'
import usersSagas from './users/sagas'

export default function sagas() {
  return [...tracksSagas(), ...collectionsSagas(), ...usersSagas()]
}
