import { initializeTriggers, listenForTrackUploads } from './db.js'
import { consume, queueMessage } from './queue.js'
import { Server } from './server/index.js'
import dotenv from 'dotenv'
import { handleTracks } from './tracks.js'

dotenv.config()

const main = async () => {
  const server = new Server()
  await server.init()

  await initializeTriggers()
  await Promise.all([
    listenForTrackUploads(queueMessage),
    consume(handlerRouter)
  ])
}

const handlerRouter = (msg) => {
  const { payload } = msg
  const message = JSON.parse(payload)
  const { entity } = message
  switch (entity) {
    case 'tracks':
      handleTracks(message)
      return
    case 'users':
      console.log('received a potential verification of a user')
      return
    default:
      console.warn('unhandled msg')
  }
}

main().catch(console.error)
