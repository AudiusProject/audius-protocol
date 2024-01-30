import { useState, useEffect, useCallback } from 'react'

import { ID, User } from '@audius/common/models'

import {} from '@audius/common'
import { Button, ButtonType, IconArrow } from '@audius/stems'
import cn from 'classnames'

import IconWand from 'assets/img/iconWand.svg'
import {
  FollowArtistsCategory,
  artistCategories
} from 'common/store/pages/signon/types'
import UserCard from 'components/card/UserCard'
import SelectablePills from 'components/selectable-pill/SelectablePills'
import { MAIN_CONTENT_ID } from 'pages/MainContentContext'

import styles from './FollowPage.module.css'

const messages = {
  title: 'Follow At Least 3 Artists To Get Started',
  subTitle:
    'Tracks uploaded or reposted by people you follow will appear in your feed.',
  pickForMe: 'Pick Some For Me',
  following: 'Following'
}

const MINIMUM_FOLLOWER_COUNT = 3

export type FollowPageProps = {
  selectedCategory: FollowArtistsCategory
  onSelectArtistCategory: (category: FollowArtistsCategory) => void
  onAddFollows: (followIds: number[]) => void
  onRemoveFollows: (followIds: number[]) => void
  onAutoSelect: () => void
  followedArtists: ID[]
  users: User[]
}

const FollowPage = ({
  followedArtists,
  selectedCategory,
  onSelectArtistCategory,
  onAddFollows,
  onRemoveFollows,
  onAutoSelect,
  users
}: FollowPageProps) => {
  useEffect(() => {
    if (window.scrollTo) window.scrollTo(0, 0)
  }, [])

  /**
   * The margin top causes a secondary scroll for mobile web causing the container to be larger than 100vh
   * This removes the margin top to make the container height 100vh
   */
  useEffect(() => {
    const mainContent = document.getElementById(MAIN_CONTENT_ID)
    if (mainContent) {
      mainContent.classList.add(styles.removeMarginTop)
      return () => {
        mainContent.classList.remove(styles.removeMarginTop)
      }
    }
  }, [])

  const onToggleSelect = useCallback(
    (userId: ID) => () => {
      if (followedArtists.includes(userId)) {
        onRemoveFollows([userId])
      } else {
        onAddFollows([userId])
      }
    },
    [onAddFollows, onRemoveFollows, followedArtists]
  )

  const [isTransitioning, setIsTransitioning] = useState(false)

  const onClickPillIndex = useCallback(
    (index: number) => {
      setIsTransitioning(true)
      onSelectArtistCategory(artistCategories[index])
    },
    [onSelectArtistCategory]
  )

  useEffect(() => {
    setIsTransitioning(false)
  }, [selectedCategory, setIsTransitioning])

  const seletablePillProps = {
    selectedIndex: artistCategories.findIndex((c) => c === selectedCategory),
    onClickIndex: onClickPillIndex,
    content: artistCategories,
    disableDelayHandler: true
  }

  return (
    <div className={cn(styles.container)}>
      <div className={cn(styles.header)}>
        <div className={styles.title}>{messages.title}</div>
        <div className={styles.subTitle}>{messages.subTitle}</div>
        <SelectablePills
          className={styles.pillSection}
          pillClassName={styles.pill}
          {...seletablePillProps}
        />
      </div>
      <div className={styles.cardSection}>
        <div className={styles.pickForMe} onClick={onAutoSelect}>
          <IconWand className={styles.iconWand} />
          {messages.pickForMe}
        </div>
        <div
          className={cn(styles.cards, {
            [styles.hide]: isTransitioning,
            [styles.show]: !isTransitioning
          })}
        >
          {users.map((user, idx) => (
            <UserCard
              key={`${selectedCategory}-${idx}`}
              isMobile
              name={user.name}
              id={user.user_id}
              imageSizes={user._profile_picture_sizes}
              selected={followedArtists.includes(user.user_id)}
              className={styles.userCard}
              followers={user.follower_count}
              onClick={onToggleSelect(user.user_id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type BottomSectionProps = {
  onNextPage: () => void
  followedArtists: ID[]
}

export const BottomSection = (props: BottomSectionProps) => {
  const { followedArtists, onNextPage } = props
  const onClickNextPage = useCallback(() => {
    if (followedArtists.length >= MINIMUM_FOLLOWER_COUNT) {
      onNextPage()
    }
  }, [followedArtists, onNextPage])

  const onRef = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      node.addEventListener('touchmove', (e: any) => e.preventDefault())
    }
  }, [])

  return (
    <div className={styles.bottomSection} ref={onRef}>
      <Button
        text='Continue'
        name='continue'
        rightIcon={<IconArrow />}
        type={
          followedArtists.length >= MINIMUM_FOLLOWER_COUNT
            ? ButtonType.PRIMARY_ALT
            : ButtonType.DISABLED
        }
        onClick={onClickNextPage}
        textClassName={styles.continueButtonText}
        className={styles.continueButton}
      />
      <div className={styles.followCount}>
        {`${messages.following} ${
          followedArtists.length > MINIMUM_FOLLOWER_COUNT
            ? followedArtists.length
            : `${followedArtists.length}/${MINIMUM_FOLLOWER_COUNT}`
        }`}
      </div>
    </div>
  )
}

export default FollowPage
