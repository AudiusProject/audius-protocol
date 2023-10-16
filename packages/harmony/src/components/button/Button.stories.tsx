import type { Meta, StoryObj } from '@storybook/react'

import * as Icons from '../typography/Icons'

import { Button } from './Button'
import { ButtonProps, ButtonSize, ButtonType } from './types'

const baseProps: ButtonProps = {
  iconLeft: Icons.IconCampfire,
  iconRight: Icons.IconCampfire,
  text: 'Click Me'
}

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  render: (props: ButtonProps) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        justifyContent: 'center',
        alignItems: 'flex-start'
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
        <Button {...baseProps} size={ButtonSize.SMALL} {...props} />
        <Button {...baseProps} size={ButtonSize.DEFAULT} {...props} />
        <Button {...baseProps} size={ButtonSize.LARGE} {...props} />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
        <Button {...baseProps} size={ButtonSize.SMALL} {...props} disabled />
        <Button {...baseProps} size={ButtonSize.DEFAULT} {...props} disabled />
        <Button {...baseProps} size={ButtonSize.LARGE} {...props} disabled />
      </div>
      <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
        <Button
          {...baseProps}
          size={ButtonSize.SMALL}
          {...props}
          text='Loading'
          minWidth={123}
          isLoading
        />
        <Button
          {...baseProps}
          size={ButtonSize.DEFAULT}
          {...props}
          text='Loading'
          minWidth={180}
          isLoading
        />
        <Button
          {...baseProps}
          size={ButtonSize.LARGE}
          {...props}
          text='Loading'
          minWidth={212}
          isLoading
        />
      </div>
    </div>
  )
}

export default meta

type Story = StoryObj<typeof Button>

// Primary
export const Primary: Story = {}

// Primary w/ color
export const PrimaryWithColor: Story = { args: { hexColor: '#13C65A' } }

// Secondary
export const Secondary: Story = { args: { variant: ButtonType.SECONDARY } }

// Tertiary
export const Tertiary: Story = { args: { variant: ButtonType.TERTIARY } }

// Destructive
export const Destructive: Story = { args: { variant: ButtonType.DESTRUCTIVE } }
