import { watchSignUpSucceeded } from './sagas/watchSignUpSucceededSaga'

const sagas = () => {
  return [watchSignUpSucceeded]
}

export default sagas
