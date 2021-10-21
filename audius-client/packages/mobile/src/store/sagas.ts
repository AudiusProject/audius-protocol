import { initKeyboardEvents } from './keyboard/sagas'

export default function* rootSaga() {
  return [initKeyboardEvents]
}
