import { StoryObj } from '@storybook/react'

import { TextLink } from '~harmony/components/text-link'

import { Text } from '../text'

import { Scrollbar } from '.'

export default {
  component: Scrollbar,
  title: 'Components/Scrollbar'
}

type Story = StoryObj<typeof Scrollbar>

export const Primary: Story = {
  render: () => (
    <div css={{ height: 200 }}>
      <Scrollbar>
        <Text variant='body'>
          <Text>
            This is some content in a scrollable container. The surrounding
            `Scrollbar` component gives this a custom scrollbar.
          </Text>
          <Text>
            `Scrollbar` is meant to be used for small scrolling areas within a
            page/view (e.g. a scrolling navigation bar), not the entire page
            itself.
          </Text>
          <Text>
            `Scrollbar` uses{' '}
            <TextLink
              href='https://www.npmjs.com/package/react-perfect-scrollbar'
              isExternal
            >
              react-perfect-scrollbar
            </TextLink>{' '}
            under the hood. For advanced use cases, refer to the documentation.
          </Text>
          <Text style={{ paddingTop: 200 }}>
            This is some content in a scrollable container. The surrounding
            `Scrollbar` component gives this a custom scrollbar.
          </Text>
          <Text>
            `Scrollbar` is meant to be used for small scrolling areas within a
            page/view (e.g. a scrolling navigation bar), not the entire page
            itself.
          </Text>
          <Text>
            `Scrollbar` uses{' '}
            <TextLink
              href='https://www.npmjs.com/package/react-perfect-scrollbar'
              isExternal
            >
              react-perfect-scrollbar
            </TextLink>{' '}
            under the hood. For advanced use cases, refer to the documentation.
          </Text>
        </Text>
      </Scrollbar>
    </div>
  )
}
