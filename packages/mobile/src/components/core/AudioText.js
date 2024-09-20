import { Text } from './Text';
var messages = {
    audio: 'audio tokens'
};
export var AudioText = function (props) {
    return (<Text accessibilityLabel={messages.audio} {...props}>
      $AUDIO
    </Text>);
};
