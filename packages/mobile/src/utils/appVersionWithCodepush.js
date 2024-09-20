import codePush from 'react-native-code-push';
import VersionNumber from 'react-native-version-number';
/** Note, this will be `null` if we are unable to get the CodePush update metadata for whatever reason. Thus, do not use this as the definitive app version value. */
var versionInfo = null;
codePush
    .getUpdateMetadata()
    .then(function (update) {
    if (update) {
        versionInfo = "".concat(VersionNumber.appVersion, "+codepush:").concat(update.label);
    }
    else {
        versionInfo = VersionNumber.appVersion;
    }
})
    .catch(function (e) {
    console.error('Error getting CodePush metadata.', e);
});
export { versionInfo };
