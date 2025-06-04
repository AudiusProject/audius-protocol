import React from 'react'

import { Flex, Text } from '@audius/harmony-native'
import { CollectionList } from 'app/components/collection-list'
import { makeStyles } from 'app/styles'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  exploreCarousel: {
    marginHorizontal: spacing(-4)
    // paddingLeft: spacing(4)
  },
  exploreCarouselContent: {
    paddingLeft: spacing(4)
  }
}))

export const ExploreCarousel = (props) => {
  //       title={messages.featuredPlaylists}
  //   data={exploreContent?.featuredPlaylists}
  //   Card={CollectionCard}
  const styles = useStyles()

  const { title, list } = props
  const carouselList = React.cloneElement(list, {
    contentContainerStyle: styles.exploreCarouselContent
  })

  return (
    <Flex gap='l'>
      <Text variant='title' size='l'>
        {title}
      </Text>
      <Flex style={styles.exploreCarousel}>{carouselList}</Flex>
    </Flex>
  )
}
