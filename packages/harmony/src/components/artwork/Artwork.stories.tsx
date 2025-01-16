import { useState } from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { Button } from '~harmony/components/button'
import { Flex } from '~harmony/components/layout'

import { Artwork, ArtworkProps } from './Artwork'

const LoadArtwork = (props: ArtworkProps) => {
  const [isLoading, setIsLoading] = useState(true)

  return (
    <Flex direction='column' gap='l' alignItems='flex-start'>
      <Artwork isLoading={isLoading} {...props} />
      <Button variant='primary' onClick={() => setIsLoading(!isLoading)}>
        Toggle Loading
      </Button>
    </Flex>
  )
}

const meta: Meta<typeof Artwork> = {
  title: 'Components/Artwork',
  component: Artwork,
  args: {
    w: 200,
    h: 200,
    src: 'https://blockdaemon-audius-content-09.bdnodes.net/content/01H5JSX00M4A83D1V1WFWZBAZK/480x480.jpg'
  }
}

export default meta

type Story = StoryObj<typeof Artwork>

export const Default: Story = {}

export const LoadingExample: Story = {
  args: {
    src: 'https://blockdaemon-audius-content-09.bdnodes.net/content/01H5JSX00M4A83D1V1WFWZBAZK/480x480.jpg'
  },
  render: LoadArtwork
}
