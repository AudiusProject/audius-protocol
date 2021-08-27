import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  Button,
  ButtonSize,
  ButtonType,
  IconPencil,
  Modal
} from '@audius/stems'
import Spin from 'antd/lib/spin'
import cn from 'classnames'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult
} from 'react-beautiful-dnd'

import { ReactComponent as IconGradientCollectibles } from 'assets/img/iconGradientCollectibles.svg'
import Drawer from 'components/drawer/Drawer'
import CollectibleDetails from 'containers/collectibles/components/CollectibleDetails'
import {
  HiddenCollectibleRow,
  VisibleCollectibleRow
} from 'containers/collectibles/components/CollectibleRow'
import styles from 'containers/collectibles/components/CollectiblesPage.module.css'
import {
  Collectible,
  CollectiblesMetadata
} from 'containers/collectibles/types'
import { ProfileUser } from 'containers/profile-page/store/types'
import { useFlag } from 'containers/remote-config/hooks'
import UserBadges from 'containers/user-badges/UserBadges'
import useInstanceVar from 'hooks/useInstanceVar'
import { FeatureFlags } from 'services/remote-config/FeatureFlags'

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

const CollectiblesPage: React.FC<{
  userId: number | null
  name: string
  isMobile: boolean
  isUserOnTheirProfile: boolean
  profile: ProfileUser
  updateProfile?: (metadata: any) => void
  onLoad?: () => void
}> = ({
  userId,
  name,
  isMobile,
  profile,
  updateProfile,
  isUserOnTheirProfile,
  onLoad
}) => {
  const { isEnabled: isSolanaCollectiblesEnabled } = useFlag(
    FeatureFlags.SOLANA_COLLECTIBLES_ENABLED
  )
  const ethCollectibleList = profile?.collectibleList ?? null
  const solanaCollectibleList = useMemo(
    () =>
      isSolanaCollectiblesEnabled ? profile?.solanaCollectibleList ?? null : [],
    [isSolanaCollectiblesEnabled, profile]
  )
  const collectibleList =
    ethCollectibleList || solanaCollectibleList
      ? (ethCollectibleList || []).concat(solanaCollectibleList || [])
      : null
  const hasCollectibles = profile?.has_collectibles ?? false
  const isLoading =
    profile.collectibleList === undefined ||
    (isSolanaCollectiblesEnabled &&
      profile.solanaCollectibleList === undefined) ||
    (hasCollectibles && !profile.collectibles)

  useEffect(() => {
    if (!isLoading && onLoad) {
      onLoad()
    }
  }, [isLoading, onLoad])

  const [
    collectiblesMetadata,
    setCollectiblesMetadata
  ] = useState<CollectiblesMetadata | null>(null)

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

  const [getHasSetEthCollectibles, setHasSetEthCollectibles] = useInstanceVar(
    false
  )
  const [
    getHasSetSolanaCollectibles,
    setHasSetSolanaCollectibles
  ] = useInstanceVar(false)
  useEffect(() => {
    if (
      collectibleList &&
      ((ethCollectibleList && !getHasSetEthCollectibles()) ||
        (solanaCollectibleList && !getHasSetSolanaCollectibles()))
    ) {
      if (!hasCollectibles) {
        /**
         * set local collectible preferences if user never saved them before
         */
        const newMetadata = {
          ...collectibleList.reduce(
            (acc, curr) => ({ ...acc, [curr.id]: {} }),
            {}
          ),
          order: collectibleList.map(c => c.id)
        }
        setCollectiblesMetadata(newMetadata)
        if (ethCollectibleList) {
          setHasSetEthCollectibles(true)
        }
        if (solanaCollectibleList) {
          setHasSetSolanaCollectibles(true)
        }
      } else if (profile.collectibles) {
        /**
         * include collectibles returned by OpenSea which have not been stored in the user preferences
         */
        const metadata: CollectiblesMetadata = {
          ...profile.collectibles,
          order: [...profile.collectibles.order]
        }
        /**
         * Update id of collectibles to use correct format
         */
        Object.keys(profile.collectibles).forEach(key => {
          if (key !== 'order' && key.indexOf(':::') === -1) {
            const savedCollectible = collectibleList.find(
              c => c.tokenId === key
            )
            if (savedCollectible) {
              metadata[savedCollectible.id] = { ...metadata[key] }
              delete metadata[key]

              const orderIndex = metadata.order.indexOf(key)
              if (orderIndex > -1) {
                metadata.order[orderIndex] = savedCollectible.id
              }
            }
          }
        })

        const collectiblesMetadataKeySet = new Set(Object.keys(metadata))
        const newCollectiblesMap = collectibleList
          .map(c => c.id)
          .filter(id => !collectiblesMetadataKeySet.has(id))
          .reduce((acc, curr) => ({ ...acc, [curr]: {} }), {})

        const newMetadata = {
          ...metadata,
          ...newCollectiblesMap,
          order: metadata.order.concat(Object.keys(newCollectiblesMap))
        }
        setCollectiblesMetadata(newMetadata)
        if (ethCollectibleList) {
          setHasSetEthCollectibles(true)
        }
        if (solanaCollectibleList) {
          setHasSetSolanaCollectibles(true)
        }
      }
    }
  }, [
    profile,
    hasCollectibles,
    collectibleList,
    ethCollectibleList,
    solanaCollectibleList,
    collectiblesMetadata,
    getHasSetEthCollectibles,
    setHasSetEthCollectibles,
    getHasSetSolanaCollectibles,
    setHasSetSolanaCollectibles
  ])

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
    if (collectibleList) {
      if (!hasCollectibles && collectiblesMetadata?.order === undefined) {
        return [...collectibleList]
      }

      const collectibleMap: {
        [key: string]: Collectible
      } = collectibleList.reduce(
        (acc, curr) => ({ ...acc, [curr.id]: curr }),
        {}
      )
      const collectibleKeySet = new Set(Object.keys(collectibleMap))

      const visible = collectiblesMetadata?.order
        .filter(id => collectibleKeySet.has(id))
        .map(id => collectibleMap[id])
      return visible || []
    }
    return []
  }, [collectiblesMetadata, collectibleList, hasCollectibles])

  const getHiddenCollectibles = useCallback(() => {
    if (collectibleList) {
      const visibleCollectibleKeySet = new Set(
        getVisibleCollectibles().map(c => c.id)
      )
      return collectibleList.filter(c => !visibleCollectibleKeySet.has(c.id))
    }
    return []
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
          ) : !getVisibleCollectibles().length && isUserOnTheirProfile ? (
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
