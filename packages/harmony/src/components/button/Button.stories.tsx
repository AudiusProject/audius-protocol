import type { Story } from '@storybook/react'

import * as Icons from '../typography/Icons'

import { Button } from './Button'
import { ButtonProps, ButtonSize, ButtonType } from './types'

export default {
  component: Button,
  title: 'Components/Button',
  argTypes: { onClick: { action: 'clicked' } }
}

const baseProps: ButtonProps = {
  iconLeft: Icons.IconCampfire,
  iconRight: Icons.IconCampfire,
  text: 'Click Me'
}

const Template: Story<ButtonProps> = (args) => (
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
      <Button {...baseProps} size={ButtonSize.SMALL} {...args} />
      <Button {...baseProps} size={ButtonSize.DEFAULT} {...args} />
      <Button {...baseProps} size={ButtonSize.LARGE} {...args} />
    </div>
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <Button {...baseProps} size={ButtonSize.SMALL} {...args} disabled />
      <Button {...baseProps} size={ButtonSize.DEFAULT} {...args} disabled />
      <Button {...baseProps} size={ButtonSize.LARGE} {...args} disabled />
    </div>
  </div>
)

// Primary
export const Primary = Template.bind({})

// Primary w/ color
export const PrimaryWithColor = Template.bind({})
PrimaryWithColor.args = { color: 'accentBlue' }

// Secondary
export const Secondary = Template.bind({})
Secondary.args = { variant: ButtonType.SECONDARY }

// Tertiary
export const Tertiary = Template.bind({})
Tertiary.args = { variant: ButtonType.TERTIARY }

// Destructive
export const Destructive = Template.bind({})
Destructive.args = { variant: ButtonType.DESTRUCTIVE }

// Ghost
export const Ghost = Template.bind({})
Ghost.args = { variant: ButtonType.GHOST }
