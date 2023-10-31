import type { Meta, StoryObj } from '@storybook/react'

import * as Icons from '../../typography/Icons'
import { PlainButtonProps, PlainButtonSize, PlainButtonType } from '../types'

import { PlainButton } from './PlainButton'

const baseProps: PlainButtonProps = {
  iconLeft: Icons.IconCampfire,
  iconRight: Icons.IconCampfire,
  children: 'Click Me'
}

type StoryArgs = {
  props: Partial<PlainButtonProps>
  dark?: boolean
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Buttons/PlainButton',
  component: ({ props }) => <PlainButton {...baseProps} {...props} />,
  render: ({ dark, props }) => (
    <div
      style={{
        background: dark ? '#878787' : undefined,
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
        <PlainButton {...baseProps} size={PlainButtonSize.DEFAULT} {...props} />
        <PlainButton {...baseProps} size={PlainButtonSize.LARGE} {...props} />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
        <PlainButton
          {...baseProps}
          size={PlainButtonSize.DEFAULT}
          {...props}
          disabled
        />
        <PlainButton
          {...baseProps}
          size={PlainButtonSize.LARGE}
          {...props}
          disabled
        />
      </div>
    </div>
  )
}

export default meta

type Story = StoryObj<StoryArgs>

// Default
export const Default: Story = {}

// Subdued
export const Subdued: Story = {
  args: { props: { variant: PlainButtonType.SUBDUED } }
}

// Inverted
export const Inverted = {
  args: {
    dark: true,
    props: { variant: PlainButtonType.INVERTED }
  }
}
