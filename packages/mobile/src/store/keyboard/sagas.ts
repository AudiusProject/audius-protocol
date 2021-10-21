import { put } from 'redux-saga/effects'
import { Keyboard } from 'react-native'

import { open, close } from './slice'

export function* initKeyboardEvents() {
  Keyboard.addListener('keyboardDidShow', () => put(open))
  Keyboard.addListener('keyboardDidHide', () => put(close))
}

export default () => [initKeyboardEvents]
