import { View, Text } from 'react-native';
var Test = function () { return <Text>hello world</Text>; };
var MyButtonMeta = {
    title: 'MeButton',
    component: Test,
    argTypes: {
        onPress: { action: 'pressed the button' }
    },
    args: {
        text: 'Hello world'
    },
    decorators: [
        function (Story) { return (<View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Story />
      </View>); }
    ]
};
export default MyButtonMeta;
export var Basic = {};
export var AnotherExample = {
    args: {
        text: 'Another example'
    }
};
