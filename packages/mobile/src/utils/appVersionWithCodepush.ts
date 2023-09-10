import codePush from 'react-native-code-push'
import VersionNumber from 'react-native-version-number'

/** Note, this will be `null` if we are unable to get the CodePush update metadata for whatever reason. Thus, do not use this as the definitive app version value. */
let versionInfo: string | null = null
codePush
  .getUpdateMetadata()
  .then((update) => {
    if (update) {
      versionInfo = `${VersionNumber.appVersion}+codepush:${update.label}`
    } else {
      versionInfo = VersionNumber.appVersion
    }
  })
  .catch((e) => {
    console.error('Error getting CodePush metadata.', e)
  })

export { versionInfo }
