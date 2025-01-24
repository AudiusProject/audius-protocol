import type { Meta, StoryObj } from '@storybook/react'

import shadowBackground from 'storybook/assets/shadowBackground.jpeg'
import { Box } from '~harmony/components/layout/Box'
import { Flex } from '~harmony/components/layout/Flex'
import { Paper } from '~harmony/components/layout/Paper'
import { IconCamera } from '~harmony/icons'

import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    controls: {}
  },
  args: {
    size: 'large'
  },

  render: (props) => {
    return (
      <Flex gap='l'>
        <Avatar {...props} />
      </Flex>
    )
  }
}

export default meta

type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  args: {
    src: shadowBackground
  }
}

export const NoImage: Story = {
  args: {
    src: undefined
  },
  render: (props) => (
    <Flex gap='m'>
      <Avatar {...props} />
      <Avatar {...props}>
        <IconCamera color='white' />
      </Avatar>
    </Flex>
  )
}
export const Strong: Story = {
  args: {
    variant: 'strong',
    src: shadowBackground
  },
  render: (props) => (
    <Paper w={350} h={160}>
      <Avatar
        css={{ position: 'absolute', top: '40px', left: '32px' }}
        {...props}
      />
      <Flex direction='column' h='100%' w='100%'>
        <Box
          h='100%'
          w='100%'
          css={{ background: `url(${shadowBackground})` }}
        />
        <Box h='100%' w='100%' />
      </Flex>
    </Paper>
  )
}
