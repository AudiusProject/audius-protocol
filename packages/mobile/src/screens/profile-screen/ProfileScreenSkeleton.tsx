import { memo } from 'react'

import { times, random } from 'lodash'
import { View } from 'react-native'

import { Flex } from '@audius/harmony-native'
import { LineupTileSkeleton } from 'app/components/lineup-tile'
import Skeleton from 'app/components/skeleton'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    marginBottom: 40
  },
  coverPhoto: {
    height: 96
  },
  profilePicture: {
    position: 'absolute',
    top: 52,
    left: 12,
    zIndex: 101,

    height: 82,
    width: 82,
    borderRadius: 1000,
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: palette.white,
    overflow: 'hidden',
    backgroundColor: palette.neutralLight6
  },
  header: {
    backgroundColor: palette.white,
    paddingTop: spacing(8),
    paddingHorizontal: spacing(3)
  },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing(5)
  },
  name: {
    height: spacing(5),
    width: 100,
    marginBottom: spacing(3)
  },
  handle: {
    height: spacing(4),
    width: 80
  },
  actionButton: {
    height: 35,
    width: 120
  },
  stats: {
    flexDirection: 'row',
    marginBottom: spacing(3)
  },
  stat: {
    height: spacing(4),
    width: 80,
    marginRight: spacing(5)
  },
  bio: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginBottom: spacing(3)
  },
  tierAndSocials: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing(3)
  },
  tier: {
    height: 50,
    width: 100,
    borderRadius: 12,
    marginRight: spacing(10)
  },
  socialLinks: {
    flexDirection: 'row',
    alignSelf: 'center',
    justifyContent: 'space-around',
    flex: 4
  },
  socialLink: {
    height: spacing(8),
    width: spacing(8),
    marginRight: spacing(3)
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: palette.neutralLight8,
    backgroundColor: palette.white,
    paddingVertical: spacing(3),
    height: 50
  },
  tab: {
    height: spacing(8),
    width: spacing(15)
  },
  lineupTile: {
    padding: spacing(3),
    paddingBottom: 0
  }
}))

const BioSkeleton = memo(() => {
  const baseStyle = {
    height: 12,
    marginRight: 4,
    marginBottom: 8
  }
  const elements = times(random(5, 15), () => random(20, 100))
  return (
    <>
      {elements.map((elementWidth: number, i) => (
        <Skeleton
          key={i}
          noShimmer
          style={[baseStyle, { width: elementWidth }]}
        />
      ))}
    </>
  )
})

export const ExpandableSectionSkeleton = memo(() => {
  const styles = useStyles()
  return (
    <Flex column gap='s'>
      <Flex row wrap='wrap'>
        <BioSkeleton />
      </Flex>
      <View style={styles.tierAndSocials}>
        <Skeleton style={styles.tier} />
        <View style={styles.socialLinks}>
          <Skeleton style={styles.socialLink} />
          <Skeleton style={styles.socialLink} />
          <Skeleton style={styles.socialLink} />
        </View>
      </View>
      {/* TODO: add tip button and supporters skeletons */}
    </Flex>
  )
})

export const ProfileHeaderSkeleton = memo(() => {
  const styles = useStyles()
  const statSkeleton = <Skeleton style={styles.stat} />

  return (
    <Flex column>
      <Skeleton height={96} />
      <Skeleton style={styles.profilePicture} />
      <Flex p='l' gap='s'>
        <Flex row justifyContent='space-between'>
          <Flex mt='3xl'>
            <Skeleton style={styles.name} />
            <Skeleton style={styles.handle} />
          </Flex>
          <Flex row gap='s'>
            <Skeleton height={32} width={32} />
            <Skeleton height={32} width={120} />
          </Flex>
        </Flex>
        <Flex row>
          {statSkeleton}
          {statSkeleton}
          {statSkeleton}
        </Flex>
      </Flex>
    </Flex>
  )
})

export const ProfileTabsSkeleton = memo(() => {
  const styles = useStyles()

  const lineupTile = (
    <View style={styles.lineupTile}>
      <LineupTileSkeleton />
    </View>
  )

  return (
    <>
      <Skeleton style={styles.tabs} />
      {lineupTile}
      {lineupTile}
      {lineupTile}
    </>
  )
})

export const ProfileScreenSkeleton = memo(() => {
  return (
    <Flex column h='100%'>
      <ProfileHeaderSkeleton />
      <ExpandableSectionSkeleton />
      <ProfileTabsSkeleton />
    </Flex>
  )
})
