import React from 'react'

import cn from 'classnames'

import { EmptyCard } from 'components/card/mobile/Card'
import { Draggable } from 'components/dragndrop'
import CategoryHeader from 'components/header/desktop/CategoryHeader'
import { useIsMobile } from 'hooks/useIsMobile'

import styles from './CardLineup.module.css'

export type CardLineupProps = {
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
}: CardLineupProps) => {
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
              kind={card.props.isAlbum ? 'album' : 'playlist'}
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

const MobileCardContainer = ({
  cards,
  containerClassName
}: CardLineupProps) => {
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

const CardLineup = (props: CardLineupProps) => {
  const isMobile = useIsMobile()
  const Container = isMobile ? MobileCardContainer : DesktopCardContainer

  return React.createElement(Container, props)
}

export default CardLineup
