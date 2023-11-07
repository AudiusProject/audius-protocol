import type { Meta, StoryObj } from '@storybook/react'

import { Box } from 'components/layout/Box'
import { Flex } from 'components/layout/Flex'
import { Paper } from 'components/layout/Paper'
// TODO: Get final image assets from Sammie
import shadowBackground from 'storybook/assets/shadowBackground.jpeg'

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
    url: shadowBackground
  }
}

export const Strong: Story = {
  args: {
    variant: 'strong',
    url: shadowBackground
  },
  render: (props) => (
    <Paper w={350} h={160}>
      <Box
        w={80}
        h={80}
        style={{ position: 'absolute', top: '40px', left: '32px' }}
      >
        <Avatar {...props} />
      </Box>
      <Flex direction='column' h='100%' w='100%'>
        <Box
          h='100%'
          w='100%'
          style={{ background: `url(${shadowBackground})` }}
        />
        <Box h='100%' w='100%' />
      </Flex>
    </Paper>
  )
}
