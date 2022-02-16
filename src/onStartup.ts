import { EventEmitter } from 'events'

const startupEventEmitter = new EventEmitter()

export const onStartup = (cb: () => void) =>
  startupEventEmitter.on('startup', cb)

export const startup = () => startupEventEmitter.emit('startup')
