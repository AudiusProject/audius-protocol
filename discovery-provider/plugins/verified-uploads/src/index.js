import { initializeTriggers, listenForVerifiedNotifs } from './db.js'
import { rootHandler } from './handlers/index.js'
import { consume, queueMessage } from './handlers/queue.js'
import { Server } from './server/index.js'

const main = async () => {
  const server = new Server()
  await server.init()

  await initializeTriggers()
  await Promise.all([
    listenForVerifiedNotifs(queueMessage),
    consume(rootHandler)
  ])
}

main().catch(console.error)
