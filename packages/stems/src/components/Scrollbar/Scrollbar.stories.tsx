import { Story } from '@storybook/react'

import { Scrollbar, ScrollbarProps } from '.'

export default {
  component: Scrollbar,
  title: 'Components/Scrollbar'
}

const Template: Story<ScrollbarProps> = ({
  children = (
    <>
      <p>
        This is some content in a scrollable container. The surrounding
        `Scrollbar` component gives this a custom scrollbar.
      </p>
      <p>
        `Scrollbar` is meant to be used for small scrolling areas within a
        page/view (e.g. a scrolling navigation bar), not the entire page itself.
      </p>
      <p>
        `Scrollbar` uses{' '}
        <a
          href='https://www.npmjs.com/package/react-perfect-scrollbar'
          target='_blank'
          rel='noreferrer'
        >
          react-perfect-scrollbar
        </a>{' '}
        under the hood. For advanced use cases, refer to the documentation.
      </p>
      <p style={{ paddingTop: 200 }}>
        This is some content in a scrollable container. The surrounding
        `Scrollbar` component gives this a custom scrollbar.
      </p>
      <p>
        `Scrollbar` is meant to be used for small scrolling areas within a
        page/view (e.g. a scrolling navigation bar), not the entire page itself.
      </p>
      <p>
        `Scrollbar` uses{' '}
        <a
          href='https://www.npmjs.com/package/react-perfect-scrollbar'
          target='_blank'
          rel='noreferrer'
        >
          react-perfect-scrollbar
        </a>{' '}
        under the hood. For advanced use cases, refer to the documentation.
      </p>
    </>
  ),
  ...args
}) => {
  return (
    <div style={{ height: 200 }}>
      <Scrollbar {...args}>{children}</Scrollbar>
    </div>
  )
}

export const Base: any = Template.bind({})
