import { TrackMetadataType, useTrackMetadata } from '@audius/common/hooks';
import { Image } from 'react-native';
import { Flex, spacing } from '@audius/harmony-native';
import { moodMap } from 'app/utils/moods';
import { MetadataItem } from './MetadataItem';
/**
 * The additional metadata shown at the bottom of the Track Screen and Collection Screen Headers
 */
export var TrackMetadataList = function (_a) {
    var trackId = _a.trackId;
    var metadataItems = useTrackMetadata({ trackId: trackId });
    var renderMood = function (value, link) { return (<Flex direction='row' gap='xs' alignItems='center'>
      <Image source={moodMap[value]} style={{ height: spacing.l, width: spacing.l }}/>
      {link}
    </Flex>); };
    return (<Flex gap='l' w='100%' direction='row' wrap='wrap'>
      {metadataItems.map(function (_a) {
            var id = _a.id, label = _a.label, value = _a.value, url = _a.url;
            return (<MetadataItem key={id} label={label} value={value} url={url} renderValue={id === TrackMetadataType.MOOD ? renderMood : undefined}/>);
        })}
    </Flex>);
};
