import { put, take } from 'redux-saga/effects'
import { Keyboard } from 'react-native'

import { open, close } from './slice'
import { eventChannel } from 'redux-saga'

function* initKeyboardEvents() {
  const keyboardChannel = eventChannel(emitter => {
    Keyboard.addListener('keyboardDidShow', () => {
      emitter('show')
    })
    Keyboard.addListener('keyboardDidHide', () => {
      emitter('hide')
    })
    return () => {}
  })

  while (true) {
    const keyboardAction = yield take(keyboardChannel)
    if (keyboardAction === 'show') {
      yield put(open())
    } else if (keyboardAction === 'hide') {
      yield put(close())
    }
  }
}

export default initKeyboardEvents
