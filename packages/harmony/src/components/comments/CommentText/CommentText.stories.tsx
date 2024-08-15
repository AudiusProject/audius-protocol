import type { Meta, StoryObj } from '@storybook/react'

import { Divider, Paper } from 'components/layout'
import { TextLink } from 'components/text-link'

import { CommentText } from './CommentText'

const meta: Meta<typeof CommentText> = {
  title: 'Components/Comments/CommentText [beta]',
  component: CommentText
}

export default meta

type Story = StoryObj<typeof CommentText>

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
      <CommentText>This is a test with some short text.</CommentText>
      <Divider />
      <CommentText>
        This is a test to see <TextLink variant='visible'>1:24</TextLink> how
        the new component for the comment body handles text of different sizes.
      </CommentText>
      <Divider />
      <CommentText>
        This is a test to see how the new component for the comment body handles
        text of different sizes. This is a test to see how the new component for
        the comment body handles text of different sizes.
      </CommentText>
      <Divider />
      <CommentText>
        This is a test to see how the new component for the comment body handles
        text of different sizes. This is a test to see how the new component for
        the comment body handles text of different sizes. This is a test to see
        how the new component for the comment body handles text of different
        sizes. This is a test to see how the new component for the comment body
        handles text of different sizes.
      </CommentText>
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
      <CommentText>This is a test with some short text.</CommentText>
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
      <CommentText>
        This is a test to see <TextLink variant='visible'>1:24</TextLink> how
        the new component for the comment body handles text of different sizes.
      </CommentText>
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
      <CommentText>
        This is a test to see how the new component for the comment body handles
        text of different sizes. This is a test to see how the new component for
        the comment body handles text of different sizes. This is a test to see
        how the new component for the comment body handles text of different
        sizes. This is a test to see how the new component for the comment body
        handles text of different sizes. This is a test to see how the new
        component for the comment body handles text of different sizes. This is
        a test to see how the new component for the comment body handles text of
        different sizes.
      </CommentText>
    </Paper>
  )
}
