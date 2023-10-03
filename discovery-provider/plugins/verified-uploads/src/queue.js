// private
const queuedMessages = []

export const queueMessage = (msg) => {
  queuedMessages.push(msg)
}

export const consume = async (callback) => {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const nextMsg = queuedMessages.shift()
    if (nextMsg !== undefined) {
      callback(nextMsg)
    }
  }
}
