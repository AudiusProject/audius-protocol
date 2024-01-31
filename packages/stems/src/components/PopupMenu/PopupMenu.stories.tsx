import { Story } from '@storybook/react'

import { Button } from 'components/Button'
import { IconCamera, IconLock, IconMail, IconPencil } from 'components/Icons'

import { PopupMenu } from './PopupMenu'
import { PopupMenuProps } from './types'

export default {
  component: PopupMenu,
  title: 'Components/PopupMenu'
}

const Template: Story<PopupMenuProps> = (args) => {
  return (
    <PopupMenu
      {...args}
      renderTrigger={(anchorRef, triggerPopup, triggerProps) => {
        return (
          <Button
            text='Click me'
            // @ts-ignore
            ref={anchorRef}
            onClick={triggerPopup as any}
            {...triggerProps}
          />
        )
      }}
    />
  )
}

// Primary
export const Primary: any = Template.bind({})
const primaryProps: Omit<PopupMenuProps, 'renderTrigger'> = {
  items: [
    {
      text: 'Item 1',
      onClick: () => {}
    },
    {
      text: 'Item 2',
      onClick: () => {}
    },
    {
      text: 'Item 3',
      onClick: () => {}
    }
  ],
  id: 'primary'
}

Primary.args = primaryProps

// WithIcons
export const WithIcons: any = Template.bind({})
const withIconsProps: Omit<PopupMenuProps, 'renderTrigger'> = {
  items: [
    {
      text: 'Item 1',
      icon: <IconCamera />,
      onClick: () => {}
    },
    {
      text: 'Item 2',
      icon: <IconMail />,
      onClick: () => {}
    },
    {
      text: 'Item 3',
      icon: <IconPencil />,
      onClick: () => {}
    },
    {
      text: 'Item 4',
      icon: <IconLock />,
      onClick: () => {}
    }
  ],
  id: 'with-icons'
}

WithIcons.args = withIconsProps
