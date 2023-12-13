import coverPhoto from '../../e2e/fixtures/coverPhoto.json'
import profilePicture from '../../e2e/fixtures/profilePicture.json'

type Options = {
  testID: string
}

export function openPicker(options: Options, callback: Function) {
  if (typeof options === 'function') {
    callback = options
  }
  const { testID } = options

  // eslint-disable-next-line n/no-callback-literal
  callback({
    assets: [
      testID === 'coverPhoto'
        ? coverPhoto
        : testID === 'profileImage'
        ? profilePicture
        : null
    ]
  })
}
