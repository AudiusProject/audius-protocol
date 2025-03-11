import type { EventMap } from 'typed-emitter'
import type TypedEventEmitter from 'typed-emitter'

export type EventEmitterTarget<T extends EventMap> = {
  addEventListener: TypedEventEmitter<T>['addListener']
  removeEventListener: TypedEventEmitter<T>['removeListener']
}
