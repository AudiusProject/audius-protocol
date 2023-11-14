import { useState, type HTMLProps, useCallback } from 'react'

import { Flex } from 'components/layout/Flex'
import { Text } from 'components/text/Text'
import { IconUserFollowing, IconUserFollow, IconUserUnfollow } from 'icons'

type FollowButtonProps = {
  variant: 'default' | 'pill'
  initialValue: boolean
} & HTMLProps<HTMLInputElement>

export const FollowButton = (props: FollowButtonProps) => {
  const { initialValue, onChange } = props
  const passthroughProps = props
  // Todo: conditional hover styling
  const isHover = false

  const [checked, setChecked] = useState(initialValue)
  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringClicked, setIsHoveringClicked] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [setIsHovering])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [setIsHovering])

  const IconComponent = checked
    ? isHover
      ? IconUserUnfollow
      : IconUserFollow
    : IconUserFollowing

  return (
    <>
      <label onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <input
          type='checkbox'
          css={{
            position: 'absolute',
            opacity: 0,
            cursor: 'pointer',
            height: 0,
            width: 0
          }}
          onChange={(e) => {
            setChecked(!checked)
            onChange?.(e)
          }}
          {...passthroughProps}
        />
        <Flex
          direction='row'
          alignItems='center'
          gap='xs'
          css={{ userSelect: 'none' }}
        >
          <IconComponent height={18} width={18} />
          <Text>
            {checked ? (isHover ? 'Unfollow' : 'Follow') : 'Following'}
          </Text>
        </Flex>
      </label>
    </>
  )
}
