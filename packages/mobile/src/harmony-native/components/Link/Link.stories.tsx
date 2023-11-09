import { NavigationContainer } from '@react-navigation/native'
import type { Story } from '@storybook/react-native'

import { Link } from './Link'

const LinkMeta = {
  title: 'Components/Link',
  component: Link,
  argTypes: {
    onPress: { action: 'pressed the link' }
  },
  args: {
    to: { screen: 'Profile', params: { id: 'jane' } },
    children: 'A link to a profile'
  },
  decorators: [
    (Story: Story) => (
      <NavigationContainer>
        <Story />
      </NavigationContainer>
    )
  ]
}

export default LinkMeta

export const Basic = {}
