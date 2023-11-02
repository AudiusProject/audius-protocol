import type { Meta, StoryObj } from '@storybook/react'

import { ColorPalette } from '../../storybook/components/ColorPalette'

// TODO use MDX and follow foundation spec
const meta: Meta<typeof ColorPalette> = {
  title: 'Foundations/Colors',
  component: ColorPalette
}

export default meta

type Story = StoryObj<typeof ColorPalette>

export const Default: Story = {}
