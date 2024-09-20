import { SquareSizes } from '@audius/common/models';
import { cacheUsersSelectors } from '@audius/common/store';
import { useSelector } from 'react-redux';
import { Avatar } from '@audius/harmony-native';
import { useProfilePicture } from '../image/UserImage';
var getUser = cacheUsersSelectors.getUser;
var messages = {
    profilePictureFor: 'Profile picture for'
};
export var ProfilePicture = function (props) {
    var userId = 'user' in props ? props.user.user_id : props.userId;
    var accessibilityLabel = useSelector(function (state) {
        var _a;
        var userName = 'user' in props ? props.user.name : (_a = getUser(state, { id: userId })) === null || _a === void 0 ? void 0 : _a.name;
        return "".concat(messages.profilePictureFor, " ").concat(userName);
    });
    var _a = useProfilePicture(userId, SquareSizes.SIZE_150_BY_150, 'user' in props ? props.user.profile_picture_sizes : undefined), source = _a.source, handleError = _a.handleError;
    return (<Avatar source={source} onError={handleError} accessibilityLabel={accessibilityLabel} {...props}/>);
};
