import type { EventMap } from 'typed-emitter'
import type TypedEventEmitter from 'typed-emitter'

export type ReadOnlyEmitter<T extends EventMap> = Pick<
  TypedEventEmitter<T>,
  'addListener' | 'removeListener' | 'removeAllListeners'
>
