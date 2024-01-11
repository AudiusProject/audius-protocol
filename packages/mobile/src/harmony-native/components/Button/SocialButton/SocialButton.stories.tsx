import type { Meta, StoryObj } from '@storybook/react-native'

import { Flex } from '../../layout/Flex/Flex'

import { SocialButton } from './SocialButton'
import type { SocialButtonProps } from './types'

const meta: Meta<SocialButtonProps> = {
  title: 'Components/Button/SocialButton',
  component: SocialButton
}

export default meta

type Story = StoryObj<SocialButtonProps>

export const Default: Story = {
  render: () => (
    <Flex direction='row' gap='m' pv='l' justifyContent='center'>
      <SocialButton socialType='tiktok' aria-label='TikTok button' />
      <SocialButton socialType='instagram' aria-label='Instagram button' />
      <SocialButton socialType='twitter' aria-label='Twitter button' />
    </Flex>
  )
}
