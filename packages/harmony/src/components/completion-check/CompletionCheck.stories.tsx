// eslint-disable-next-line @typescript-eslint/no-unused-vars
// import React from 'react'

import type { Meta, StoryObj } from '@storybook/react'

import { CompletionCheck } from './CompletionCheck'

const meta: Meta<typeof CompletionCheck> = {
  title: 'Components/CompletionCheck',
  component: CompletionCheck
}

export default meta

type Story = StoryObj<typeof CompletionCheck>

export const Incomplete: Story = {
  args: {
    value: 'incomplete'
  }
}

export const Complete: Story = {
  args: {
    value: 'complete'
  }
}

export const Error: Story = {
  args: {
    value: 'error'
  }
}
