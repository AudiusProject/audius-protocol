import { View, Text } from 'react-native'

const Test = () => <Text>hello world</Text>

const MyButtonMeta = {
  title: 'MeButton',
  component: Test,
  argTypes: {
    onPress: { action: 'pressed the button' }
  },
  args: {
    text: 'Hello world'
  },
  decorators: [
    (Story) => (
      <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
        <Story />
      </View>
    )
  ]
}

export default MyButtonMeta

export const Basic = {}

export const AnotherExample = {
  args: {
    text: 'Another example'
  }
}
