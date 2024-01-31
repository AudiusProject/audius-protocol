import { Story } from '@storybook/react'

import { ModalContent, ModalFooter, ModalFooterProps } from '.'

export default {
  component: ModalFooter,
  title: 'Components/Modal/ModalFooter'
}

const Template: Story<ModalFooterProps> = ({
  children = (
    <>
      This is a ModalFooter component. Use me inside a Modal (check the
      &quot;Composed&quot; Modal story for an example)!
    </>
  ),
  ...args
}) => {
  return <ModalContent {...args}>{children}</ModalContent>
}

export const Base: any = Template.bind({})
