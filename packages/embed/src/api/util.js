export const sendPostMessage = (data) => {
  if (typeof data !== 'object') return
  if (window.parent !== window) {
    const message = data
    message.from = 'audiusembed'
    window.parent.postMessage(JSON.stringify(message), '*')
  }
}
