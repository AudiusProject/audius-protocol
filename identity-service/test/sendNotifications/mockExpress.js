const mockExpressApp = {
  get: (resource) => {
    switch (resource) {
      case 'announcements': {
        return []
      }
      case 'mailgun': {
        return {
          messages: () => ({
            send: (_, cb) => {
              cb(undefined, 'body')
            }
          })
        }
      }
      default:
        return undefined
    }
  }
}

module.exports = mockExpressApp
