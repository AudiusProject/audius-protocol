export const rootHandler = (msg) => {
  const { payload } = msg
  const message = JSON.parse(payload)
  const { entity } = message
  switch (entity) {
    case 'tracks':
      console.log('received a verified track upload')
      return
    case 'users':
      console.log('received a potential verification of a user')
      return
    default:
      console.warn('unhandled msg')
  }
}
