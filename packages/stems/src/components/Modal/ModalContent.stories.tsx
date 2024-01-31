import { Story } from '@storybook/react'

import { ModalContent, ModalContentProps } from './'

export default {
  component: ModalContent,
  title: 'Components/Modal/ModalContent'
}

const Template: Story<ModalContentProps> = ({
  children = (
    <>
      This is a ModalContent component. Use me inside a Modal (check the
      &quot;Composed&quot; Modal story for an example)!
    </>
  ),
  ...args
}) => {
  return <ModalContent {...args}>{children}</ModalContent>
}

export const Base: any = Template.bind({})
