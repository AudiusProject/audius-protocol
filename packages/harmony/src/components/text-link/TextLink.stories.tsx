import type { Meta, StoryObj } from '@storybook/react'

import { Flex, Paper } from '~harmony/components/layout'
import { Text } from '~harmony/components/text'
import darkBackgroundSpace from 'storybook/assets/darkBackgroundSpace.jpg'

import { TextLink } from './TextLink'

const meta: Meta<typeof TextLink> = {
  title: 'Text/TextLink',
  component: TextLink,
  args: {
    textVariant: 'body',
    strength: 'strong',
    children: 'Display Name',
    href: '../?path=/docs/text-textlink--documentation'
  },
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
      <Paper
        h={84}
        direction='row'
        gap='4xl'
        alignItems='center'
        p='2xl'
        css={{ background: `url(${darkBackgroundSpace})` }}
      >
        <Story />
      </Paper>
    )
  ]
}

export const External: Story = {
  args: {
    children: 'External links open a new tab',
    href: 'https://audius.co',
    isExternal: true
  }
}

export const MatchesTextStyle: Story = {
  render: () => (
    <Text variant='heading' size='l'>
      This is some large heading text{' '}
      <TextLink variant='visible'>with a link</TextLink> in it.
    </Text>
  )
}

export const AsChild: Story = {
  render: (props) => (
    <TextLink asChild {...props}>
      <p>asChild</p>
    </TextLink>
  )
}
