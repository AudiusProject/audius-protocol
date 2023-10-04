import coverPhoto from '../../e2e/fixtures/coverPhoto.json'
import profilePicture from '../../e2e/fixtures/profilePicture.json'

function launchImageLibrary(options: any, callback: Function) {
  if (typeof options === 'function') {
    callback = options
  }
  const { name } = options

  // eslint-disable-next-line n/no-callback-literal
  callback({
    assets: [
      name === 'cover_photo'
        ? coverPhoto
        : name === 'profile_picture'
        ? profilePicture
        : null
    ]
  })
}
export default launchImageLibrary
