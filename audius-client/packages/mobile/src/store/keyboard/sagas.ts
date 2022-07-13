import { Keyboard } from 'react-native'
import { eventChannel } from 'redux-saga'
import { put, take } from 'redux-saga/effects'

import { open, close } from './slice'

function* initKeyboardEvents() {
  const keyboardChannel = eventChannel((emitter) => {
    Keyboard.addListener('keyboardDidShow', () => {
      emitter('show')
    })
    Keyboard.addListener('keyboardDidHide', () => {
      emitter('hide')
    })
    return () => {}
  })

  while (true) {
    const keyboardAction: 'show' | 'hide' = yield take(keyboardChannel)
    if (keyboardAction === 'show') {
      yield put(open())
    } else if (keyboardAction === 'hide') {
      yield put(close())
    }
  }
}

export default initKeyboardEvents
