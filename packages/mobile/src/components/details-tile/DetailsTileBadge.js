import Color from 'color';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { IconRobot, Text, Flex, Button } from '@audius/harmony-native';
export var DetailsTileBadge = function (props) {
    var children = props.children, color = props.color, onPress = props.onPress;
    var rootStyles = {
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: new Color(color).fade(0.5).string(),
        backgroundColor: new Color(color).fade(0.8).string()
    };
    return (<TouchableOpacity onPress={onPress}>
      <Flex as={Button} direction='row' gap='xs' ph='s' pv='xs' borderRadius='s' alignItems='center' style={rootStyles}>
        <IconRobot size='s' fill={color}/>
        <Text variant='label' size='s' style={{ color: color }}>
          {children}
        </Text>
      </Flex>
    </TouchableOpacity>);
};
