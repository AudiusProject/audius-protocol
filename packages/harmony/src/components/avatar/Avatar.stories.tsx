import type { Meta, StoryObj } from '@storybook/react'

import { Box } from 'components/layout/Box'
import { Flex } from 'components/layout/Flex'
import { Paper } from 'components/layout/Paper'
import { IconCamera } from 'icons'
import shadowBackground from 'storybook/assets/shadowBackground.jpeg'
// TODO: Get final image assets from Sammie

import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    controls: {}
  },
  render: (props) => {
    return (
      <Box w={80} h={80}>
        <Avatar {...props} />
      </Box>
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
      <Box w={80} h={80}>
        <Avatar {...props} />
      </Box>
      <Box w={80} h={80}>
        <Avatar {...props}>
          <IconCamera color='staticWhite' />
        </Avatar>
      </Box>
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
      <Box
        w={80}
        h={80}
        css={{ position: 'absolute', top: '40px', left: '32px' }}
      >
        <Avatar {...props} />
      </Box>
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
