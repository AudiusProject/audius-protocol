import type { Meta, StoryObj } from '@storybook/react'

import { Divider, Paper } from 'components/layout'
import { TextLink } from 'components/text-link'

import { CommentBody } from './CommentBody'

const meta: Meta<typeof CommentBody> = {
  title: 'Components/Comments/CommentBody [beta]',
  component: CommentBody
}

export default meta

type Story = StoryObj<typeof CommentBody>

export const Default: Story = {
  render: () => (
    <Paper
      direction='column'
      gap='xl'
      p='xl'
      w={400}
      backgroundColor='white'
      shadow='flat'
      border='strong'
    >
      <CommentBody>This is a test with some short text.</CommentBody>
      <Divider />
      <CommentBody>
        This is a test to see <TextLink variant='visible'>1:24</TextLink> how
        the new component for the comment body handles text of different sizes.
      </CommentBody>
      <Divider />
      <CommentBody>
        This is a test to see how the new component for the comment body handles
        text of different sizes. This is a test to see how the new component for
        the comment body handles text of different sizes.
      </CommentBody>
      <Divider />
      <CommentBody>
        This is a test to see how the new component for the comment body handles
        text of different sizes. This is a test to see how the new component for
        the comment body handles text of different sizes. This is a test to see
        how the new component for the comment body handles text of different
        sizes. This is a test to see how the new component for the comment body
        handles text of different sizes.
      </CommentBody>
    </Paper>
  )
}

export const SingleLine: Story = {
  render: () => (
    <Paper
      direction='column'
      p='xl'
      w={400}
      backgroundColor='white'
      shadow='flat'
      border='strong'
    >
      <CommentBody>This is a test with some short text.</CommentBody>
    </Paper>
  )
}

export const MultiLine: Story = {
  render: () => (
    <Paper
      direction='column'
      p='xl'
      w={400}
      backgroundColor='white'
      shadow='flat'
      border='strong'
    >
      <CommentBody>
        This is a test to see <TextLink variant='visible'>1:24</TextLink> how
        the new component for the comment body handles text of different sizes.
      </CommentBody>
    </Paper>
  )
}

export const Overflown: Story = {
  render: () => (
    <Paper
      direction='column'
      p='xl'
      w={400}
      backgroundColor='white'
      shadow='flat'
      border='strong'
    >
      <CommentBody>
        This is a test to see how the new component for the comment body handles
        text of different sizes. This is a test to see how the new component for
        the comment body handles text of different sizes. This is a test to see
        how the new component for the comment body handles text of different
        sizes. This is a test to see how the new component for the comment body
        handles text of different sizes. This is a test to see how the new
        component for the comment body handles text of different sizes. This is
        a test to see how the new component for the comment body handles text of
        different sizes.
      </CommentBody>
    </Paper>
  )
}
