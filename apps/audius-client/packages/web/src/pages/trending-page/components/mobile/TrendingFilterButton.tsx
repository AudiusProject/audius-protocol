import HeaderButton from 'components/header-button/HeaderButton'

import styles from './TrendingFilterButton.module.css'

type TrendingFilterButtonProps = {
  onClick: () => void
  selectedGenre: string | null
}

const messages = {
  allGenres: 'All Genres'
}

// Header button for filtering trending by
// genre.
const TrendingFilterButton = ({
  onClick,
  selectedGenre
}: TrendingFilterButtonProps) => {
  return (
    <HeaderButton
      showIcon={false}
      onClick={onClick}
      text={selectedGenre || messages.allGenres}
      className={styles.button}
    />
  )
}

export default TrendingFilterButton
