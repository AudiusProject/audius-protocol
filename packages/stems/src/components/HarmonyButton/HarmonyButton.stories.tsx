import { Story } from '@storybook/react'

import * as Icons from 'components/Icons'

import { HarmonyButton } from './HarmonyButton'
import {
  HarmonyButtonProps,
  HarmonyButtonSize,
  HarmonyButtonType
} from './types'

export default {
  component: HarmonyButton,
  title: 'Components/HarmonyButton',
  argTypes: { onClick: { action: 'clicked' } }
}

const baseProps: HarmonyButtonProps = {
  iconLeft: Icons.IconCampfire,
  iconRight: Icons.IconCampfire,
  text: 'Click Me'
}

const Template: Story<HarmonyButtonProps> = (args) => (
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
      <HarmonyButton {...baseProps} size={HarmonyButtonSize.SMALL} {...args} />
      <HarmonyButton
        {...baseProps}
        size={HarmonyButtonSize.DEFAULT}
        {...args}
      />
      <HarmonyButton {...baseProps} size={HarmonyButtonSize.LARGE} {...args} />
    </div>
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <HarmonyButton
        {...baseProps}
        size={HarmonyButtonSize.SMALL}
        {...args}
        disabled
      />
      <HarmonyButton
        {...baseProps}
        size={HarmonyButtonSize.DEFAULT}
        {...args}
        disabled
      />
      <HarmonyButton
        {...baseProps}
        size={HarmonyButtonSize.LARGE}
        {...args}
        disabled
      />
    </div>
  </div>
)

// Primary
export const Primary: any = Template.bind({})

// Primary w/ color
export const PrimaryWithColor: any = Template.bind({})
PrimaryWithColor.args = { color: 'accentBlue' }

// Secondary
export const Secondary: any = Template.bind({})
Secondary.args = { variant: HarmonyButtonType.SECONDARY }

// Tertiary
export const Tertiary: any = Template.bind({})
Tertiary.args = { variant: HarmonyButtonType.TERTIARY }

// Destructive
export const Destructive: any = Template.bind({})
Destructive.args = { variant: HarmonyButtonType.DESTRUCTIVE }

// Ghost
export const Ghost: any = Template.bind({})
Ghost.args = { variant: HarmonyButtonType.GHOST }
