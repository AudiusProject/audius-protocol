import { useState } from 'react'

import type { Meta } from '@storybook/react'

import { Flex } from 'components/layout'

import { FollowButton } from './FollowButton'
import type { FollowButtonProps } from './types'

const meta: Meta<typeof FollowButton> = {
  title: 'Buttons/FollowButton',
  component: FollowButton,
  render: (props: FollowButtonProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [following, setFollowing] = useState(false)
    return (
      <FollowButton
        following={following}
        onFollow={() => setFollowing(true)}
        onUnfollow={() => setFollowing(false)}
        {...props}
      />
    )
  }
}

export default meta

export const Default = {}

export const Pill = {
  args: {
    variant: 'pill'
  }
}

export const Variants = {
  render: (props: FollowButtonProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [following, setFollowing] = useState(false)
    return (
      <Flex gap='xl'>
        <FollowButton
          following={following}
          onFollow={() => setFollowing(true)}
          onUnfollow={() => setFollowing(false)}
          {...props}
        />
        <FollowButton
          following={following}
          onFollow={() => setFollowing(true)}
          onUnfollow={() => setFollowing(false)}
          variant='pill'
          {...props}
        />
      </Flex>
    )
  }
}

export const Sizes = {
  render: (props: FollowButtonProps) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [following, setFollowing] = useState(false)
    return (
      <Flex gap='xl'>
        <FollowButton
          following={following}
          onFollow={() => setFollowing(true)}
          onUnfollow={() => setFollowing(false)}
          {...props}
        />
        <FollowButton
          following={following}
          onFollow={() => setFollowing(true)}
          onUnfollow={() => setFollowing(false)}
          size='small'
          {...props}
        />
      </Flex>
    )
  }
}
