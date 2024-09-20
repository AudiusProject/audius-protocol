import { useEffect } from 'react';
import { aiPageActions, aiPageSelectors } from '@audius/common/store';
import { TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { IconRobot } from '@audius/harmony-native';
import { MusicBadge } from 'app/harmony-native/components/MusicBadge/MusicBadge';
import { useNavigation } from 'app/hooks/useNavigation';
var fetchAiUser = aiPageActions.fetchAiUser, reset = aiPageActions.reset;
var getAiUser = aiPageSelectors.getAiUser;
var messages = {
    aiGenerated: 'AI Generated'
};
export var DetailsTileAiAttribution = function (_a) {
    var userId = _a.userId;
    var navigation = useNavigation();
    var dispatch = useDispatch();
    var user = useSelector(getAiUser);
    useEffect(function () {
        dispatch(fetchAiUser({ userId: userId }));
        return function cleanup() {
            dispatch(reset());
        };
    }, [dispatch, userId]);
    var handlePress = function () {
        navigation.navigate('AiGeneratedTracks', { userId: userId });
    };
    return user ? (<TouchableOpacity onPress={handlePress}>
      <MusicBadge icon={IconRobot} color='aiGreen'>
        {messages.aiGenerated}
      </MusicBadge>
    </TouchableOpacity>) : null;
};
