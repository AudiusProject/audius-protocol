import cn from 'classnames'
import { connect } from 'react-redux'

import { EmptyCard } from 'components/card/mobile/Card'
import Draggable from 'components/dragndrop/Draggable'
import CategoryHeader from 'components/header/desktop/CategoryHeader'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import styles from './CardLineup.module.css'

type OwnProps = {
  categoryName?: string
  cards: JSX.Element[]
  containerClassName?: string
  cardsClassName?: string
  onMore?: () => void
}

const DesktopCardContainer = ({
  categoryName,
  cards,
  containerClassName,
  cardsClassName,
  onMore
}: OwnProps) => {
  return (
    <div className={cn(containerClassName)}>
      {categoryName && (
        <CategoryHeader categoryName={categoryName} onMore={onMore} />
      )}
      <div className={cn(styles.cardsContainer, cardsClassName)}>
        {cards.map((card) => {
          return card.props.link ? (
            <Draggable
              key={`draggable-${card.props.playlistId}`}
              text={card.props.primaryText}
              kind={card.props.isPlaylist ? 'playlist' : 'album'}
              id={card.props.playlistId}
              link={card.props.link}
            >
              {card}
            </Draggable>
          ) : (
            card
          )
        })}
      </div>
    </div>
  )
}

const EmptyMobileCard = () => (
  <div className={styles.mobileCardContainer}>
    <EmptyCard />
  </div>
)

const renderEmptyCards = (cardsLength: number) => {
  if (cardsLength === 1) {
    return (
      <>
        <EmptyMobileCard />
        <EmptyMobileCard />
      </>
    )
  }
  if (cardsLength === 2) {
    return <EmptyMobileCard />
  }
  if (cardsLength % 2 === 1) {
    return <EmptyMobileCard />
  }
  return null
}

const MobileCardContainer = ({ cards, containerClassName }: OwnProps) => {
  return (
    <div className={cn(styles.mobileContainer, containerClassName)}>
      {cards.map((card, index) => (
        <div className={styles.mobileCardContainer} key={index}>
          {card}
        </div>
      ))}
      {renderEmptyCards(cards.length)}
    </div>
  )
}

type CardLineupProps = OwnProps & ReturnType<typeof mapStateToProps>

const CardLineup = (props: CardLineupProps) => {
  const { isMobile, ...containerProps } = props
  const Container = isMobile ? MobileCardContainer : DesktopCardContainer

  return <Container {...containerProps} />
}

function mapStateToProps(state: AppState) {
  return {
    isMobile: isMobile()
  }
}

export default connect(mapStateToProps)(CardLineup)
