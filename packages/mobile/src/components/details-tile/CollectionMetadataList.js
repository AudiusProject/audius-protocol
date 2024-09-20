import { useCollectionMetadata } from '@audius/common/hooks';
import { Flex } from '@audius/harmony-native';
import { MetadataItem } from './MetadataItem';
/**
 * The additional metadata shown at the bottom of the Collection Screen Header
 */
export var CollectionMetadataList = function (props) {
    var collectionId = props.collectionId;
    var metadataItems = useCollectionMetadata({ collectionId: collectionId });
    return (<Flex gap='l' w='100%' direction='row' wrap='wrap'>
      {metadataItems.map(function (_a) {
            var label = _a.label, id = _a.id, value = _a.value;
            return (<MetadataItem key={id} label={label} value={value}/>);
        })}
    </Flex>);
};
