import React, { useEffect, useContext } from 'react'

import MobilePageContainer from 'components/general/MobilePageContainer'
import NavContext, { LeftPreset } from 'containers/nav/store/context'
import GenreSelectionList from 'containers/trending-page/components/GenreSelectionList'

import styles from './TrendingGenreSelectionPage.module.css'

type TrendingGenreSelectionPageProps = {
  selectedGenre: string | null
  didSelectGenre: (genre: string | null) => void
  genres: string[]
}

const messages = {
  title: 'PICK A GENRE'
}

const TrendingGenreSelectionPage = ({
  selectedGenre,
  didSelectGenre,
  genres
}: TrendingGenreSelectionPageProps) => {
  const { setLeft, setCenter, setRight } = useContext(NavContext)!

  useEffect(() => {
    setLeft(LeftPreset.BACK)
    setCenter(messages.title)
    setRight(null)
  }, [setLeft, setCenter, setRight])

  return (
    <MobilePageContainer backgroundClassName={styles.pageBackground} fullHeight>
      <GenreSelectionList
        genres={genres}
        didSelectGenre={didSelectGenre}
        selectedGenre={selectedGenre}
        containerClassName={styles.container}
        isMobile
      />
    </MobilePageContainer>
  )
}

export default TrendingGenreSelectionPage
