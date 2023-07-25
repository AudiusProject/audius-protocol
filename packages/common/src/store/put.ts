import { ThunkAction } from '@reduxjs/toolkit'
import { Action } from 'redux'
import { put as putBase } from 'typed-redux-saga'

// Helper function to redefine 'typed-redux-saga' put action to also accpet
// a redux-thunk action. Needed for some of our actions, like cacheActions.add
export function* put(action: Action | ThunkAction<any, any, any, any>) {
  // @ts-expect-error
  return yield* putBase(action)
}
