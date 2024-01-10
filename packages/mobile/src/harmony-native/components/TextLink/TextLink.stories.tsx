import { css } from '@emotion/native'
import { NavigationContainer } from '@react-navigation/native'
import type { Meta, StoryObj } from '@storybook/react'
import { ImageBackground } from 'react-native'

import { Text } from '../Text/Text'
import { Flex } from '../layout/Flex/Flex'
import { Paper } from '../layout/Paper/Paper'

import { TextLink } from './TextLink'
import darkBackgroundSpace from './darkBackgroundSpace.jpg'

const meta: Meta<typeof TextLink<{ Profile: { id: string } }>> = {
  title: 'Components/TextLink',
  component: TextLink<{ Profile: { id: string } }>,
  args: {
    to: { screen: 'Profile', params: { id: 'jane' } },
    textVariant: 'body',
    strength: 'strong',
    children: 'Display Name'
  },
  decorators: [
    (Story) => (
      <NavigationContainer>
        <Story />
      </NavigationContainer>
    )
  ],
  render: (props) => (
    <Flex direction='row' gap='4xl'>
      <TextLink {...props} />
      <TextLink {...props} showUnderline />
    </Flex>
  )
}

export default meta

type Story = StoryObj<typeof TextLink>

export const Primary: Story = {
  render: (props) => <TextLink {...props} />
}

export const Default: Story = {
  args: {
    variant: 'default'
  }
}

export const Visible: Story = {
  args: {
    variant: 'visible',
    strength: 'weak',
    children: 'Terms of Service'
  }
}

export const Inverted: Story = {
  args: {
    variant: 'inverted'
  },
  decorators: [
    (Story) => (
      <Paper h={84} style={css({ overflow: 'hidden' })}>
        <ImageBackground source={darkBackgroundSpace}>
          <Flex direction='row' gap='4xl' alignItems='center' p='2xl'>
            <Story />
          </Flex>
        </ImageBackground>
      </Paper>
    )
  ]
}

export const MatchesTextStyle: Story = {
  render: (props) => (
    <Text variant='heading' size='l'>
      This is some large heading text{' '}
      <TextLink {...props} variant='visible'>
        with a link
      </TextLink>{' '}
      in it.
    </Text>
  )
}
