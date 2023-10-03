// private
const queuedMessages = []

export const queueMessage = (msg) => {
  console.log({ msg }, 'queueing msg')
  queuedMessages.push(msg)
}

export const consume = async (callback) => {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    const nextMsg = queuedMessages.shift()
    if (nextMsg !== undefined) {
      callback(nextMsg)
    }
  }
}
