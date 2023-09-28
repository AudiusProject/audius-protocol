import type { Meta, StoryObj } from '@storybook/react'

import { ColorPalette } from './components/ColorPalette/ColorPalette'

const meta: Meta<typeof ColorPalette> = {
  title: 'Foundations/Colors',
  component: ColorPalette
}

export default meta

type Story = StoryObj<typeof ColorPalette>

export const Default: Story = {}
