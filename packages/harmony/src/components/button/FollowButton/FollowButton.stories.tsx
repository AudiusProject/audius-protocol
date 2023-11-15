import { useState } from 'react'

import { Flex } from 'components/layout'

import { FollowButton, FollowButtonProps } from './FollowButton'

const Meta = {
  title: 'Buttons/FollowButton',
  component: FollowButton,
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

export default Meta

export const Default = {}

export const Pill = {
  args: {
    variant: 'pill'
  }
}
