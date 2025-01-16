import { useCallback } from 'react'

import {
  SquareSizes,
  WidthSizes,
  Supporting,
  User
} from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { Nullable } from '@audius/common/utils'
import { Flex, IconTrophy, Paper, Text } from '@audius/harmony'
import { useDispatch, useSelector } from 'react-redux'

import { Avatar } from 'components/avatar'
import { CoverPhotoV2 } from 'components/cover-photo/CoverPhotoV2'
import { UserLink } from 'components/link'
import { AppState } from 'store/types'
import { TIPPING_TOP_RANK_THRESHOLD } from 'utils/constants'
import { push } from 'utils/navigation'

const { getUser } = cacheUsersSelectors

type SupportingCardProps = {
  supporting: Supporting
}

export const SupportingTile = ({ supporting }: SupportingCardProps) => {
  const receiver = useSelector<AppState, Nullable<User>>((state) =>
    getUser(state, { id: supporting.receiver_id })
  )

  const dispatch = useDispatch()
  const { rank } = supporting
  const handle = receiver?.handle
  const isTopRank = rank >= 1 && rank <= TIPPING_TOP_RANK_THRESHOLD

  const handleClick = useCallback(() => {
    dispatch(push(`/${handle}`))
  }, [dispatch, handle])

  return receiver ? (
    <CoverPhotoV2
      userId={receiver.user_id}
      size={WidthSizes.SIZE_640}
      column
      h={122}
      p='m'
      justifyContent='flex-end'
      onClick={handleClick}
    >
      {isTopRank ? (
        <Paper
          shadow='near'
          alignSelf='flex-end'
          borderRadius='circle'
          border='default'
          pv='2xs'
          ph='xs'
          gap='2xs'
          css={(theme) => ({
            position: 'absolute',
            right: theme.spacing.s,
            top: theme.spacing.s
          })}
        >
          <IconTrophy color='accent' />
          <Flex inline alignItems='center'>
            <Text variant='title' size='s' color='accent' tag='span'>
              #
            </Text>
            <Text variant='title' size='l' color='accent' tag='span'>
              {rank}
            </Text>
          </Flex>
        </Paper>
      ) : null}
      <Flex gap='s'>
        <Avatar
          userId={receiver.user_id}
          imageSize={SquareSizes.SIZE_150_BY_150}
          h={32}
          w={32}
        />
        <UserLink
          userId={receiver.user_id}
          variant='inverted'
          textVariant='title'
          size='s'
          disabled
          ellipses
        />
      </Flex>
    </CoverPhotoV2>
  ) : null
}
