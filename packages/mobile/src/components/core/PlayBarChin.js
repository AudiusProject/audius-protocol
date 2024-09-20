import { playerSelectors } from '@audius/common/store';
import { View } from 'react-native';
import { useSelector } from 'react-redux';
import { PLAY_BAR_HEIGHT } from '../now-playing-drawer';
var getHasTrack = playerSelectors.getHasTrack;
export var PlayBarChin = function () {
    var hasTrack = useSelector(getHasTrack);
    return <View style={{ height: hasTrack ? PLAY_BAR_HEIGHT : 0 }}/>;
};
