import React from 'react'

import cn from 'classnames'
import { connect } from 'react-redux'

import CategoryHeader from 'components/general/header/desktop/CategoryHeader'
import Draggable from 'containers/dragndrop/Draggable'
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
        {cards.map(card => {
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

const MobileCardContainer = ({ cards, containerClassName }: OwnProps) => {
  const emptyMobileCard = cards.length % 2 === 1
  return (
    <div className={cn(styles.mobileContainer, containerClassName)}>
      {cards.map((card, index) => (
        <div className={styles.mobileCardContainer} key={index}>
          {card}
        </div>
      ))}
      {emptyMobileCard ? (
        <div
          className={cn(
            styles.mobileCardContainer,
            styles.emptyMobileContainer
          )}
        ></div>
      ) : null}
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
