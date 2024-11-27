import { memo } from 'react'

import { times, random } from 'lodash'
import { View } from 'react-native'

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
    top: 37,
    left: 11,
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

export const ProfileScreenSkeleton = memo(() => {
  const styles = useStyles()

  const statSkeleton = <Skeleton style={styles.stat} />

  const lineupTile = (
    <View style={styles.lineupTile}>
      <LineupTileSkeleton />
    </View>
  )

  return (
    <View style={styles.root}>
      <Skeleton style={styles.coverPhoto} />
      <Skeleton style={styles.profilePicture} />
      <View style={styles.header}>
        <View style={styles.info}>
          <View>
            <Skeleton style={styles.name} />
            <Skeleton style={styles.handle} />
          </View>
          <Skeleton style={styles.actionButton} />
        </View>
        <View style={styles.stats}>
          {statSkeleton}
          {statSkeleton}
          {statSkeleton}
        </View>
        <View style={styles.bio}>
          <BioSkeleton />
        </View>
        <View style={styles.tierAndSocials}>
          <Skeleton style={styles.tier} />
          <View style={styles.socialLinks}>
            <Skeleton style={styles.socialLink} />
            <Skeleton style={styles.socialLink} />
            <Skeleton style={styles.socialLink} />
          </View>
        </View>
      </View>
      <View style={styles.tabs}></View>
      {lineupTile}
      {lineupTile}
      {lineupTile}
    </View>
  )
})
