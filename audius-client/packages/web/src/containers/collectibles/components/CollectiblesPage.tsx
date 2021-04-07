import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  Button,
  ButtonSize,
  ButtonType,
  IconLink,
  IconPencil,
  Modal
} from '@audius/stems'
import cn from 'classnames'
import styles from 'containers/collectibles/components/CollectiblesPage.module.css'
import PerspectiveCard from 'components/perspective-card/PerspectiveCard'
import DynamicImage from 'components/dynamic-image/DynamicImage'
import UserBadges from 'containers/user-badges/UserBadges'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult
} from 'react-beautiful-dnd'
import { ReactComponent as IconVolume } from 'assets/img/iconVolume.svg'
import { ReactComponent as IconMute } from 'assets/img/iconVolume0.svg'
import { ReactComponent as IconPlay } from 'assets/img/pbIconPlay.svg'
import { ReactComponent as IconGradientCollectibles } from 'assets/img/iconGradientCollectibles.svg'
import { Collectible, CollectiblesMetadata, CollectibleType } from './types'
import { ProfileUser } from 'containers/profile-page/store/types'
import { formatDate } from 'utils/timeUtil'
import Drawer from 'components/drawer/Drawer'
import Spin from 'antd/lib/spin'
import {
  HiddenCollectibleRow,
  VisibleCollectibleRow
} from 'containers/collectibles/components/CollectibleRow'
import { getCollectibleImage, isConsideredVideo } from '../helpers'
import { Nullable } from 'utils/typeUtils'

export const editTableContainerClass = 'editTableContainer'

const VISIBLE_COLLECTIBLES_DROPPABLE_ID = 'visible-collectibles-droppable'

export const collectibleMessages = {
  title: 'COLLECTIBLES',
  subtitlePrefix: 'A collection of NFT collectibles owned and created by ',
  owned: 'OWNED',
  created: 'CREATED',
  edit: 'EDIT',
  linkToCollectible: 'Link To Collectible',
  noVisibleCollectible:
    "Visitors to your profile won't see this tab until you show at least one NFT Collectible.",
  sortCollectibles: 'Sort Your Collectibles',
  editCollectibles: 'Edit Collectibles',
  visibleCollectibles: 'Visible Collectibles',
  hiddenCollectibles: 'Hidden Collectibles',
  showCollectible: 'Show collectible',
  hideCollectible: 'Hide collectible',
  visibleThumbnail: 'Visible collectible thumbnail',
  hiddenThumbnail: 'Hidden collectible thumbnail',
  editInBrowser:
    'Visit audius.co from a desktop browser to hide and sort your NFT collectibles.',
  videoNotSupported: 'Your browser does not support the video tag.'
}

const CollectibleMedia: React.FC<{
  type: CollectibleType
  imageUrl: Nullable<string>
  animationUrl: Nullable<string>
  isMuted: boolean
  toggleMute: () => void
}> = ({ type, imageUrl, animationUrl, isMuted, toggleMute }) => {
  return type === CollectibleType.IMAGE ? (
    <div className={styles.detailsMediaWrapper}>
      <img src={imageUrl!} alt='Collectible' />
    </div>
  ) : (
    <div className={styles.detailsMediaWrapper} onClick={toggleMute}>
      <video muted={isMuted} autoPlay loop>
        <source
          src={animationUrl!}
          type={`video/${animationUrl!.slice(
            animationUrl!.lastIndexOf('.') + 1
          )}`}
        />
        {collectibleMessages.videoNotSupported}
      </video>
      {isMuted ? (
        <IconMute className={styles.volumeIcon} />
      ) : (
        <IconVolume className={styles.volumeIcon} />
      )}
    </div>
  )
}

const CollectibleDetails: React.FC<{
  collectible: Collectible
  isMobile: boolean
}> = ({ collectible, isMobile }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)
  const [isMuted, setIsMuted] = useState<boolean>(true)
  const [image, setImage] = useState<Nullable<string>>(null)

  useEffect(() => {
    getCollectibleImage(collectible).then(frame => setImage(frame))
  }, [collectible])

  const handleItemClick = useCallback(() => {
    if (isMobile) {
      setIsDrawerOpen(true)
    } else {
      setIsModalOpen(true)
    }
  }, [isMobile, setIsDrawerOpen, setIsModalOpen])

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted)
  }, [isMuted, setIsMuted])

  return (
    <div className={styles.detailsContainer}>
      <PerspectiveCard
        className={styles.perspectiveCard}
        onClick={handleItemClick}
      >
        {image ? (
          <div>
            <DynamicImage image={image} wrapperClassName={styles.media} />
            {isConsideredVideo(collectible) && (
              <IconPlay className={styles.playIcon} />
            )}
            <div className={styles.stamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className={styles.media} />
        )}
        <div className={styles.nftTitle}>{collectible.name}</div>
      </PerspectiveCard>

      <Modal
        title='Collectible'
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
        }}
        showTitleHeader
        showDismissButton
        bodyClassName={styles.modalBody}
        headerContainerClassName={styles.modalHeader}
        titleClassName={styles.modalTitle}
        allowScroll
      >
        <div className={styles.nftModal}>
          <CollectibleMedia
            type={collectible.type}
            imageUrl={collectible.imageUrl}
            animationUrl={collectible.animationUrl}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />

          <div className={styles.details}>
            <div className={styles.detailsTitle}>{collectible.name}</div>
            <div className={styles.detailsStamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}
            </div>

            {collectible.dateCreated && (
              <div>
                <div>Date Created:</div>
                <div className={styles.date}>
                  {formatDate(collectible.dateCreated)}
                </div>
              </div>
            )}

            {collectible.dateLastTransferred && (
              <div>
                <div>Last Transferred:</div>
                <div className={styles.date}>
                  {formatDate(collectible.dateLastTransferred)}
                </div>
              </div>
            )}

            <div className={styles.detailsDescription}>
              {collectible.description}
            </div>

            {collectible.externalLink && (
              <a
                className={styles.link}
                href={collectible.externalLink}
                target='_blank'
                rel='noopener noreferrer'
              >
                <IconLink className={styles.linkIcon} />
                {collectibleMessages.linkToCollectible}
              </a>
            )}
          </div>
        </div>
      </Modal>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isFullscreen
      >
        <div className={styles.nftDrawer}>
          <CollectibleMedia
            type={collectible.type}
            imageUrl={collectible.imageUrl}
            animationUrl={collectible.animationUrl}
            isMuted={isMuted}
            toggleMute={toggleMute}
          />

          <div className={styles.details}>
            <div className={styles.detailsTitle}>{collectible.name}</div>
            <div className={styles.detailsStamp}>
              {collectible.isOwned ? (
                <span className={styles.owned}>
                  {collectibleMessages.owned}
                </span>
              ) : (
                <span className={styles.created}>
                  {collectibleMessages.created}
                </span>
              )}
            </div>

            {collectible.dateCreated && (
              <div className={styles.dateWrapper}>
                <div>Date Created:</div>
                <div className={styles.date}>
                  {formatDate(collectible.dateCreated)}
                </div>
              </div>
            )}

            {collectible.dateLastTransferred && (
              <div className={styles.dateWrapper}>
                <div>Last Transferred:</div>
                <div className={styles.date}>
                  {formatDate(collectible.dateLastTransferred)}
                </div>
              </div>
            )}

            <div className={styles.detailsDescription}>
              {collectible.description}
            </div>

            {collectible.externalLink && (
              <a
                className={styles.link}
                href={collectible.externalLink}
                target='_blank'
                rel='noopener noreferrer'
              >
                <IconLink className={styles.linkIcon} />
                {collectibleMessages.linkToCollectible}
              </a>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

const CollectiblesPage: React.FC<{
  userId: number | null
  name: string
  isMobile: boolean
  isUserOnTheirProfile: boolean
  profile: ProfileUser
  updateProfile?: (metadata: any) => void
}> = ({
  userId,
  name,
  isMobile,
  profile,
  updateProfile,
  isUserOnTheirProfile
}) => {
  const isLoading = profile.collectibleList === undefined

  const collectibleList = profile.collectibleList || []

  const [
    collectiblesMetadata,
    setCollectiblesMetadata
  ] = useState<CollectiblesMetadata | null>(profile.collectibles || null)

  const [isEditingPreferences, setIsEditingPreferences] = useState<boolean>(
    false
  )
  const [showUseDesktopDrawer, setShowUseDesktopDrawer] = useState<boolean>(
    false
  )

  const visibleTableRef = useRef<HTMLDivElement | null>(null)
  const [showVisibleTableTopShadow, setShowVisibleTableTopShadow] = useState<
    boolean
  >(false)
  const [
    showVisibleTableBottomShadow,
    setShowVisibleTableBottomShadow
  ] = useState<boolean>(false)

  const hiddenTableRef = useRef<HTMLDivElement | null>(null)
  const [showHiddenTableTopShadow, setShowHiddenTableTopShadow] = useState<
    boolean
  >(false)
  const [
    showHiddenTableBottomShadow,
    setShowHiddenTableBottomShadow
  ] = useState<boolean>(false)

  useEffect(() => {
    let visibleTableScrollListener: EventListenerOrEventListenerObject,
      hiddenTableScrollListener: EventListenerOrEventListenerObject

    const visibleTableElement = visibleTableRef?.current
    if (visibleTableElement) {
      setShowVisibleTableBottomShadow(
        visibleTableElement.scrollHeight > visibleTableElement.clientHeight
      )
      visibleTableScrollListener = () => {
        const { scrollTop, scrollHeight, clientHeight } = visibleTableElement
        setShowVisibleTableTopShadow(scrollTop > 0)
        setShowVisibleTableBottomShadow(scrollTop < scrollHeight - clientHeight)
      }
      visibleTableElement.addEventListener('scroll', visibleTableScrollListener)
    }

    const hiddenTableElement = hiddenTableRef?.current
    if (hiddenTableElement) {
      setShowHiddenTableBottomShadow(
        hiddenTableElement.scrollHeight > hiddenTableElement.clientHeight
      )
      hiddenTableScrollListener = () => {
        const { scrollTop, scrollHeight, clientHeight } = hiddenTableElement
        setShowHiddenTableTopShadow(scrollTop > 0)
        setShowHiddenTableBottomShadow(scrollTop < scrollHeight - clientHeight)
      }
      hiddenTableElement.addEventListener('scroll', hiddenTableScrollListener)
    }

    return () => {
      if (visibleTableElement) {
        visibleTableElement.removeEventListener(
          'scroll',
          visibleTableScrollListener
        )
      }

      if (hiddenTableElement) {
        hiddenTableElement.removeEventListener(
          'scroll',
          hiddenTableScrollListener
        )
      }
    }
  }, [isEditingPreferences])

  useEffect(() => {
    if (!collectiblesMetadata) {
      /**
       * set local collectible preferences if user never saved them before
       */
      setCollectiblesMetadata({
        ...collectibleList.reduce(
          (acc, curr) => ({ ...acc, [curr.id]: {} }),
          {}
        ),
        order: collectibleList.map(c => c.id)
      })
    } else {
      /**
       * include collectibles returned by OpenSea which have not been stored in the user preferences
       */
      const collectiblesMetadataKeySet = new Set(
        Object.keys(collectiblesMetadata)
      )
      const newCollectiblesMap = collectibleList
        .map(c => c.id)
        .filter(id => !collectiblesMetadataKeySet.has(id))
        .reduce((acc, curr) => ({ ...acc, [curr]: {} }), {})

      setCollectiblesMetadata({
        ...collectiblesMetadata,
        ...newCollectiblesMap,
        order: collectiblesMetadata.order.concat(
          Object.keys(newCollectiblesMap)
        )
      })
    }
    // eslint-disable-next-line
  }, [])

  const handleEditClick = useCallback(() => {
    if (isMobile) {
      setShowUseDesktopDrawer(true)
    } else {
      setIsEditingPreferences(true)
    }
  }, [isMobile, setShowUseDesktopDrawer, setIsEditingPreferences])

  const handleDoneClick = useCallback(() => {
    setIsEditingPreferences(false)
    if (updateProfile) {
      updateProfile({
        ...profile,
        has_collectibles: true,
        collectibles: { ...collectiblesMetadata }
      })
    }
  }, [setIsEditingPreferences, updateProfile, profile, collectiblesMetadata])

  const handleShowCollectible = useCallback(
    (id: string) => () => {
      setCollectiblesMetadata({
        ...collectiblesMetadata,
        order: (collectiblesMetadata?.order ?? []).concat(id)
      })
    },
    [setCollectiblesMetadata, collectiblesMetadata]
  )

  const handleHideCollectible = useCallback(
    (id: string) => () => {
      setCollectiblesMetadata({
        ...collectiblesMetadata,
        [id]: collectiblesMetadata?.id ?? {},
        order: (collectiblesMetadata?.order ?? []).filter(
          tokenId => tokenId !== id
        )
      })
    },
    [setCollectiblesMetadata, collectiblesMetadata]
  )

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result

    if (!destination || destination.index === source.index) {
      return
    }

    let newCollectibleList = getVisibleCollectibles()
    const sourceCollectible = newCollectibleList.splice(source.index, 1)[0]
    newCollectibleList = newCollectibleList
      .slice(0, destination.index)
      .concat(sourceCollectible)
      .concat(newCollectibleList.slice(destination.index))

    setCollectiblesMetadata({
      ...collectiblesMetadata,
      order: newCollectibleList
        .map(c => c.id)
        .filter(id => (collectiblesMetadata?.order || []).includes(id))
    })
  }

  const getVisibleCollectibles = useCallback(() => {
    if (collectiblesMetadata?.order === undefined) {
      return [...collectibleList]
    }

    const collectibleMap: {
      [key: string]: Collectible
    } = collectibleList.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {})
    const collectibleKeySet = new Set(Object.keys(collectibleMap))

    return collectiblesMetadata.order
      .filter(id => collectibleKeySet.has(id))
      .map(id => collectibleMap[id])
  }, [collectiblesMetadata, collectibleList])

  const getHiddenCollectibles = useCallback(() => {
    const visibleCollectibleKeySet = new Set(
      getVisibleCollectibles().map(c => c.id)
    )
    return collectibleList.filter(c => !visibleCollectibleKeySet.has(c.id))
  }, [getVisibleCollectibles, collectibleList])

  return (
    <div
      className={cn(styles.collectiblesWrapper, { [styles.mobile]: isMobile })}
    >
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div className={styles.headerText}>
            <div className={styles.title}>{collectibleMessages.title}</div>
            <div className={styles.subtitle}>
              {`${collectibleMessages.subtitlePrefix}${name}`}
              {userId && (
                <UserBadges
                  className={styles.badges}
                  userId={userId}
                  badgeSize={12}
                />
              )}
            </div>
          </div>

          {isUserOnTheirProfile && (
            <Button
              type={ButtonType.COMMON}
              size={ButtonSize.TINY}
              text={collectibleMessages.edit}
              leftIcon={<IconPencil />}
              onClick={handleEditClick}
            />
          )}
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.spinnerContainer}>
              <Spin className={styles.spinner} size='large' />
            </div>
          ) : !getVisibleCollectibles().length ? (
            <div className={styles.noVisibleCollectible}>
              {collectibleMessages.noVisibleCollectible}
            </div>
          ) : (
            <div className={styles.container}>
              {getVisibleCollectibles().map(collectible => (
                <CollectibleDetails
                  key={collectible.id}
                  collectible={collectible}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        title={collectibleMessages.sortCollectibles}
        isOpen={isEditingPreferences}
        onClose={() => setIsEditingPreferences(false)}
        showTitleHeader
        showDismissButton
        bodyClassName={cn(styles.modalBody, styles.editModalBody)}
        headerContainerClassName={styles.modalHeader}
        titleClassName={styles.modalTitle}
        allowScroll
      >
        <div className={styles.editModal}>
          {getVisibleCollectibles().length > 0 && (
            <div className={styles.editListSection}>
              <DragDropContext onDragEnd={onDragEnd}>
                <div className={styles.editListHeader}>
                  {collectibleMessages.visibleCollectibles}
                </div>

                <div
                  className={cn(
                    styles.editTableContainer,
                    editTableContainerClass,
                    {
                      [styles.tableTopShadow]: showVisibleTableTopShadow,
                      [styles.tableBottomShadow]: showVisibleTableBottomShadow,
                      [styles.tableVerticalShadow]:
                        showVisibleTableTopShadow &&
                        showVisibleTableBottomShadow
                    }
                  )}
                  ref={visibleTableRef}
                >
                  <Droppable droppableId={VISIBLE_COLLECTIBLES_DROPPABLE_ID}>
                    {provided => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {getVisibleCollectibles().map((c, index) => (
                          <Draggable
                            key={c.id}
                            draggableId={c.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <VisibleCollectibleRow
                                {...provided.draggableProps}
                                handleProps={provided.dragHandleProps}
                                forwardRef={provided.innerRef}
                                isDragging={snapshot.isDragging}
                                collectible={c}
                                onHideClick={handleHideCollectible(c.id)}
                              />
                            )}
                          </Draggable>
                        ))}

                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </DragDropContext>
            </div>
          )}

          {getHiddenCollectibles().length > 0 && (
            <div className={styles.editListSection}>
              <div className={styles.editListHeader}>
                {collectibleMessages.hiddenCollectibles}
              </div>

              <div
                className={cn(styles.editTableContainer, {
                  [styles.tableTopShadow]: showHiddenTableTopShadow,
                  [styles.tableBottomShadow]: showHiddenTableBottomShadow,
                  [styles.tableVerticalShadow]:
                    showHiddenTableTopShadow && showHiddenTableBottomShadow
                })}
                ref={hiddenTableRef}
              >
                {getHiddenCollectibles().map(c => (
                  <HiddenCollectibleRow
                    key={c.id}
                    collectible={c}
                    onShowClick={handleShowCollectible(c.id)}
                  />
                ))}
              </div>
            </div>
          )}

          <Button
            className={styles.editDoneButton}
            type={ButtonType.PRIMARY_ALT}
            size={ButtonSize.SMALL}
            text='Done'
            onClick={handleDoneClick}
          />
        </div>
      </Modal>

      <Drawer
        isOpen={showUseDesktopDrawer}
        onClose={() => setShowUseDesktopDrawer(false)}
      >
        <div className={styles.editDrawer}>
          <IconGradientCollectibles className={styles.editDrawerIcon} />
          <div className={styles.editDrawerTitle}>
            {collectibleMessages.editCollectibles}
          </div>
          <div className={styles.editDrawerContent}>
            {collectibleMessages.editInBrowser}
          </div>
        </div>
      </Drawer>
    </div>
  )
}

export default CollectiblesPage
