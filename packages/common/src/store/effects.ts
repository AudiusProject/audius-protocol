import { GetContextEffect } from 'redux-saga/effects'
import { getContext as getContextBase, SagaGenerator } from 'typed-redux-saga'

import { CommonStoreContext } from './storeContext'

export const getContext = <Prop extends keyof CommonStoreContext>(
  prop: Prop
): SagaGenerator<CommonStoreContext[Prop], GetContextEffect> =>
  getContextBase(prop)
