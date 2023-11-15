import type { Meta, StoryObj } from '@storybook/react'

import { Flex, Paper } from 'components/layout'
import { Text } from 'components/text/Text'
import darkBackgroundSpace from 'storybook/assets/darkBackgroundSpace.jpg'

import { TextLink } from './TextLink'

const meta: Meta<typeof TextLink> = {
  title: 'Text/TextLink',
  component: TextLink,
  args: {
    children: 'This is a link',
    href: '../?path=/docs/text-textlink--documentation'
  },
  render: (props) => (
    <Text variant='body' strength='strong'>
      <Flex direction='row' gap='4xl'>
        <TextLink {...props} />
        <TextLink {...props} _isHovered />
      </Flex>
    </Text>
  )
}

export default meta

type Story = StoryObj<typeof TextLink>

export const Default: Story = {}

export const Subdued: Story = {
  args: {
    variant: 'subdued'
  }
}

export const Inverted: Story = {
  args: {
    variant: 'inverted'
  },
  render: (props) => (
    <Text variant='body' strength='strong'>
      <Paper
        h={84}
        direction='row'
        gap='4xl'
        alignItems='center'
        p='2xl'
        css={{ background: `url(${darkBackgroundSpace})` }}
      >
        <TextLink {...props} />
        <TextLink {...props} _isHovered />
      </Paper>
    </Text>
  )
}

export const External: Story = {
  args: {
    children: 'External links open a new tab',
    href: 'https://audius.co',
    isExternal: true
  }
}

export const MatchesTextStyle: Story = {
  render: (props) => (
    <Text variant='heading' size='l'>
      This is some large heading text{' '}
      <TextLink {...props}>with a link</TextLink> in it.
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
