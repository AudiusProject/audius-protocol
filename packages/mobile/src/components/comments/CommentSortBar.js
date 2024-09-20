import { useCurrentCommentSection } from '@audius/common/context';
import { TrackCommentsSortMethodEnum } from '@audius/sdk';
import { Flex, SelectablePill } from '@audius/harmony-native';
var messages = {
    top: 'Top',
    newest: 'Newest',
    timestamp: 'Timestamp'
};
export var CommentSortBar = function () {
    var _a = useCurrentCommentSection(), currentSort = _a.currentSort, setCurrentSort = _a.setCurrentSort;
    return (<Flex gap='s' direction='row'>
      <SelectablePill type='radio' label={messages.top} isSelected={currentSort === TrackCommentsSortMethodEnum.Top} onPress={function () { return setCurrentSort(TrackCommentsSortMethodEnum.Top); }}/>
      <SelectablePill type='radio' label={messages.newest} isSelected={currentSort === TrackCommentsSortMethodEnum.Newest} onPress={function () { return setCurrentSort(TrackCommentsSortMethodEnum.Newest); }}/>
      <SelectablePill type='radio' label={messages.timestamp} isSelected={currentSort === TrackCommentsSortMethodEnum.Timestamp} onPress={function () { return setCurrentSort(TrackCommentsSortMethodEnum.Timestamp); }}/>
    </Flex>);
};
