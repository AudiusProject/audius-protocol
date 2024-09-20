import { useCallback } from 'react';
import { accountSelectors, challengesSelectors } from '@audius/common/store';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { Button, IconArrowRight, IconValidationCheck } from '@audius/harmony-native';
import Text from 'app/components/text';
import { useNavigation } from 'app/hooks/useNavigation';
import { makeStyles } from 'app/styles';
var getCompletionStages = challengesSelectors.getCompletionStages;
var getAccountUser = accountSelectors.getAccountUser;
var messages = {
    profileCheckNameAndHandle: 'Name & Handle',
    profileCheckProfilePicture: 'Profile Picture',
    profileCheckCoverPhoto: 'Cover Photo',
    profileCheckProfileDescription: 'Profile Description',
    profileCheckFavorite: 'Favorite Track/Playlist',
    profileCheckRepost: 'Repost Track/Playlist',
    profileCheckFollow: 'Follow Five People',
    profileCompletionButton: 'View Your Profile'
};
var useStyles = makeStyles(function (_a) {
    var palette = _a.palette;
    return ({
        columnContainer: {
            marginBottom: 32,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap'
        },
        checkContainer: {
            display: 'flex',
            flexDirection: 'row',
            flexBasis: '50%',
            marginBottom: 1
        },
        checkText: {
            marginLeft: 8
        },
        checkTextDone: {
            textDecorationLine: 'line-through'
        },
        checkCircle: {
            height: 16,
            width: 16,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: palette.neutralLight4
        }
    });
});
export var ProfileCompletionChecks = function (_a) {
    var _b;
    var isComplete = _a.isComplete, onClose = _a.onClose;
    var currentUser = useSelector(getAccountUser);
    var completionStages = useSelector(getCompletionStages);
    var styles = useStyles();
    var navigation = useNavigation();
    var goToProfile = useCallback(function () {
        onClose();
        if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.handle) {
            navigation.navigate('Profile', { handle: currentUser.handle });
        }
    }, [currentUser, onClose, navigation]);
    if (!currentUser || !(currentUser === null || currentUser === void 0 ? void 0 : currentUser.handle)) {
        return null;
    }
    var config = (_b = {},
        _b[messages.profileCheckNameAndHandle] = completionStages.hasNameAndHandle,
        _b[messages.profileCheckProfilePicture] = completionStages.hasProfilePicture,
        _b[messages.profileCheckCoverPhoto] = completionStages.hasCoverPhoto,
        _b[messages.profileCheckProfileDescription] = completionStages.hasProfileDescription,
        _b[messages.profileCheckFavorite] = completionStages.hasFavoritedItem,
        _b[messages.profileCheckRepost] = !!completionStages.hasReposted,
        _b[messages.profileCheckFollow] = completionStages.hasFollowedAccounts,
        _b);
    return (<View>
      <View style={styles.columnContainer}>
        {Object.keys(config).map(function (key) { return (<View key={key} style={styles.checkContainer}>
            {config[key] ? (<IconValidationCheck fill={'white'}/>) : (<View style={styles.checkCircle}/>)}
            <Text style={[
                styles.checkText,
                config[key] ? styles.checkTextDone : {}
            ]}>
              {key}
            </Text>
          </View>); })}
      </View>
      <Button variant={isComplete ? 'secondary' : 'primary'} iconRight={IconArrowRight} onPress={goToProfile}>
        {messages.profileCompletionButton}
      </Button>
    </View>);
};
