import { css } from '@emotion/native'

import { Box, Flex } from '@audius/harmony-native'
import { StaticSkeleton } from 'app/components/skeleton'

type Props = {
  tag: string
  height?: number
}

const profileStyle = css({ height: 74, width: 74, borderRadius: 74 })

export const UserListItemSkeleton = (props: Props) => {
  const { tag } = props
  const isSupporterTile = ['SUPPORTING', 'TOP SUPPORTERS'].includes(tag)
  const itemHeight = isSupporterTile ? 167 : 147

  return (
    <Flex direction='column' p='l' gap='s' h={itemHeight}>
      <Flex gap='s'>
        <StaticSkeleton style={profileStyle} />
        <Flex direction='column' gap='m' flex={1}>
          <Flex direction='column' gap='s'>
            <Box as={StaticSkeleton} w={100} h={16} />
            <Box as={StaticSkeleton} w={100} h={16} />
          </Flex>
          <Box as={StaticSkeleton} w={200} h={18} />
          {isSupporterTile ? (
            <Flex justifyContent='space-between'>
              <Box as={StaticSkeleton} w={100} h={18} />
              <Box as={StaticSkeleton} w={100} h={18} />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
      <Box as={StaticSkeleton} w='100%' h={32} borderRadius='xl' />
    </Flex>
  )
}
