import { Flex, Text, TextLink } from '@audius/harmony-native';
export var MetadataItem = function (props) {
    var label = props.label, value = props.value, url = props.url, renderValueProp = props.renderValue;
    var renderValue = function () {
        var valueElement = url ? (<TextLink url={url} variant='visible' size='s' strength='strong'>
        {value}
      </TextLink>) : (<Text size='s' strength='strong'>
        {value}
      </Text>);
        if (renderValueProp) {
            return renderValueProp(value, valueElement);
        }
        else {
            return valueElement;
        }
    };
    return (<Flex direction='row' alignItems='center' gap='xs'>
      <Text variant='label' color='subdued'>
        {label}
      </Text>
      {renderValue()}
    </Flex>);
};
