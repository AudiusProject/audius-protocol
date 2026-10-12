import type { Action } from 'redux'
import { buffers } from 'redux-saga'
import type { MulticastChannel } from 'redux-saga'
import type { ActionPattern } from 'redux-saga/effects'
import {
  actionChannel,
  all,
  call,
  flush,
  getContext,
  put,
  spawn,
  take
} from 'typed-redux-saga'

import { sagaWithErrorHandler } from './sagaHelpers'

type SagaList = Array<() => Generator<any, void, any>>

type LazySagasConfig = {
  /** Actions that need the lazily loaded sagas to be running */
  pattern: ActionPattern
  /** Loads the module whose default export returns the sagas to run */
  load: () => Promise<{ default: () => SagaList }>
  /**
   * Start loading right away instead of waiting for the first matching
   * action. The module still stays out of the boot bundle.
   */
  eager?: boolean
}

/**
 * Context key for the redux-saga stdChannel the saga middleware was created
 * with. Replayed actions are put straight on it so they reach the newly
 * started sagas without running through the reducers a second time.
 */
export const SAGA_CHANNEL_CONTEXT_KEY = 'sagaChannel'

/**
 * Wraps a feature's sagas so their module (and its dependencies) is only
 * loaded once an action that needs it is dispatched. Matching actions that
 * arrive before the sagas are running are buffered and replayed to them.
 *
 * Every watcher in the loaded module must register its take/takeEvery/
 * takeLatest synchronously when started, otherwise it can miss the replay.
 */
export const lazySagas = ({ pattern, load, eager }: LazySagasConfig) => {
  function* lazySagaLoader() {
    const pending = yield* actionChannel(pattern, buffers.expanding<Action>())
    let first: Action | null = eager ? null : yield* take(pending)

    let sagas: SagaList
    while (true) {
      try {
        const module = yield* call(load)
        sagas = module.default()
        break
      } catch (e) {
        // Most likely a failed chunk download. Drop what is queued and try
        // again on the next matching action.
        console.error('Failed to load sagas', e)
        yield* flush(pending)
        first = yield* take(pending)
      }
    }

    const queued = yield* flush(pending)
    pending.close()

    yield* all(sagas.map((saga) => spawn(sagaWithErrorHandler, saga)))

    const channel = (yield* getContext(SAGA_CHANNEL_CONTEXT_KEY)) as
      | MulticastChannel<Action>
      | undefined
    for (const action of first ? [first, ...queued] : queued) {
      if (channel) {
        yield* put(channel, action)
      } else {
        yield* put(action)
      }
    }
  }
  return lazySagaLoader
}
