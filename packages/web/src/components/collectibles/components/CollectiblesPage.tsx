import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  useUpdateUserCollectibles,
  useUserCollectibles
} from '@audius/common/api'
import { useInstanceVar } from '@audius/common/hooks'
import {
  CollectiblesMetadata,
  Collectible,
  UserMetadata
} from '@audius/common/models'
import {
  collectibleDetailsUISelectors,
  collectibleDetailsUIActions
} from '@audius/common/store'
import { getHash, route } from '@audius/common/utils'
import {
  Modal,
  IconKebabHorizontal,
  IconPencil,
  IconShare,
  PopupMenu,
  PopupMenuItem,
  Button,
  Flex,
  ModalHeader,
  ModalTitle,
  ModalContent,
  Text
} from '@audius/harmony'
import cn from 'classnames'
import { chunk } from 'lodash'
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult
} from 'react-beautiful-dnd'
import { useDispatch, useSelector } from 'react-redux'
import { AutoSizer, ColumnSizer, Grid, WindowScroller } from 'react-virtualized'

import { useHistoryContext } from 'app/HistoryProvider'
import IconGradientCollectibles from 'assets/img/iconGradientCollectibles.svg'
import { useModalState } from 'common/hooks/useModalState'
import CollectibleDetails from 'components/collectibles/components/CollectibleDetails'
import {
  HiddenCollectibleRow,
  VisibleCollectibleRow
} from 'components/collectibles/components/CollectibleRow'
import Drawer from 'components/drawer/Drawer'
import EmbedFrame from 'components/embed-modal/components/EmbedFrame'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'
import Toast from 'components/toast/Toast'
import { ToastContext } from 'components/toast/ToastContext'
import { ComponentPlacement, MountPlacement } from 'components/types'
import UserBadges from 'components/user-badges/UserBadges'
import { useMainContentRef } from 'pages/MainContentContext'
import { copyToClipboard, getCopyableLink } from 'utils/clipboardUtil'
import { BASE_GA_URL, doesMatchRoute } from 'utils/route'
import zIndex from 'utils/zIndex'

import styles from './CollectiblesPage.module.css'
const { PROFILE_PAGE_COLLECTIBLE_DETAILS } = route
const { getCollectible } = collectibleDetailsUISelectors
const { setCollectible } = collectibleDetailsUIActions

export const editTableContainerClass = 'editTableContainer'

const BASE_EMBED_URL = `${BASE_GA_URL}/embed`

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
  embedCollectibles: 'Embed Collectibles',
  visibleCollectibles: 'Visible Collectibles',
  hiddenCollectibles: 'Hidden Collectibles',
  showCollectible: 'Show collectible',
  hideCollectible: 'Hide collectible',
  visibleThumbnail: 'Visible collectible thumbnail',
  hiddenThumbnail: 'Hidden collectible thumbnail',
  editInBrowser:
    'Visit audius.co from a desktop browser to hide and sort your NFT collectibles.',
  videoNotSupported: 'Your browser does not support the video tag.',
  clickCopy: 'Click To Copy',
  copied: 'Copied to Clipboard',
  done: 'Done',
  setAsProfilePic: 'Set As Profile Pic',
  setAsProfilePicDescription:
    'Are you sure you want to change your profile picture?',
  setAsProfilePickCancel: 'Nevermind',
  setAsProfilePickConfirm: 'Yes',
  collectibleOptions: 'Collectible Options'
}

const dedupe = (list: any[]) => {
  return [...new Set(list)]
}

type CollectiblesPageProps = {
  userId: number | null
  name: string
  isMobile: boolean
  isUserOnTheirProfile: boolean
  profile: UserMetadata
  allowUpdates?: boolean
  updateProfilePicture?: (
    selectedFiles: any,
    source: 'original' | 'unsplash' | 'url'
  ) => void
  onLoad?: () => void
  onSave?: () => void
}

const CollectiblesPage = (props: CollectiblesPageProps) => {
  const {
    userId,
    name,
    isMobile,
    profile,
    allowUpdates = false,
    updateProfilePicture,
    isUserOnTheirProfile,
    onLoad,
    onSave
  } = props
  const { toast } = useContext(ToastContext)
  const { data: profileCollectibles, isLoading: isProfileCollectiblesLoading } =
    useUserCollectibles({ userId })
  const {
    mutate: updateUserCollectibles,
    isPending: isUpdatingUserCollectibles
  } = useUpdateUserCollectibles()
  const dispatch = useDispatch()
  const ethCollectibleList = profile?.collectibleList ?? null
  const solanaCollectibleList = useMemo(() => {
    return profile?.solanaCollectibleList ?? null
  }, [profile])
  const { history } = useHistoryContext()

  const collectibleList = useMemo(() => {
    return ethCollectibleList || solanaCollectibleList
      ? (ethCollectibleList || []).concat(solanaCollectibleList || [])
      : null
  }, [ethCollectibleList, solanaCollectibleList])
  const hasCollectibles = profile?.has_collectibles ?? false
  const isLoading =
    profile.collectibleList === undefined ||
    profile.solanaCollectibleList === undefined ||
    isProfileCollectiblesLoading

  useEffect(() => {
    if (!isLoading && onLoad) {
      onLoad()
    }
  }, [isLoading, onLoad])

  const [collectiblesMetadata, setCollectiblesMetadata] =
    useState<CollectiblesMetadata | null>(null)

  const [, setIsDetailsModalOpen] = useModalState('CollectibleDetails')

  const [isEditingPreferences, setIsEditingPreferences] =
    useState<boolean>(false)
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState<boolean>(false)
  const [showUseDesktopDrawer, setShowUseDesktopDrawer] =
    useState<boolean>(false)

  const [embedCollectibleHash, setEmbedCollectibleHash] = useState<
    string | null
  >(null)

  const visibleTableRef = useRef<HTMLDivElement | null>(null)
  const [showVisibleTableTopShadow, setShowVisibleTableTopShadow] =
    useState<boolean>(false)
  const [showVisibleTableBottomShadow, setShowVisibleTableBottomShadow] =
    useState<boolean>(false)

  const hiddenTableRef = useRef<HTMLDivElement | null>(null)
  const [showHiddenTableTopShadow, setShowHiddenTableTopShadow] =
    useState<boolean>(false)
  const [showHiddenTableBottomShadow, setShowHiddenTableBottomShadow] =
    useState<boolean>(false)

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

  const [getHasSetEthCollectibles, setHasSetEthCollectibles] =
    useInstanceVar(false)
  const [getHasSetSolanaCollectibles, setHasSetSolanaCollectibles] =
    useInstanceVar(false)
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
          order: dedupe(collectibleList.map((c) => c.id))
        }
        setCollectiblesMetadata(newMetadata)
        if (ethCollectibleList) {
          setHasSetEthCollectibles(true)
        }
        if (solanaCollectibleList) {
          setHasSetSolanaCollectibles(true)
        }
      } else if (profileCollectibles) {
        /**
         * include collectibles returned by OpenSea which have not been stored in the user preferences
         */
        const dedupedCollectiblesOrder = dedupe(profileCollectibles.order)
        const metadata: CollectiblesMetadata = {
          ...profileCollectibles,
          order: dedupedCollectiblesOrder
        }

        // Remove duplicates in user collectibles order if any
        if (
          isUserOnTheirProfile &&
          userId &&
          allowUpdates &&
          profileCollectibles.order.length !== dedupedCollectiblesOrder.length
        ) {
          updateUserCollectibles({
            userId,
            collectibles: metadata
          })
        }

        /**
         * Update id of collectibles to use correct format
         */
        Object.keys(profileCollectibles).forEach((key) => {
          if (key !== 'order' && key.indexOf(':::') === -1) {
            const savedCollectible = collectibleList.find(
              (c) => c.tokenId === key
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
          .map((c) => c.id)
          .filter((id) => !collectiblesMetadataKeySet.has(id))
          .reduce((acc: { [key: string]: object }, curr: string) => {
            acc[curr] = {}
            return acc
          }, {})

        const newMetadata = {
          ...metadata,
          ...newCollectiblesMap,
          order: dedupe(metadata.order.concat(Object.keys(newCollectiblesMap)))
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
    profileCollectibles,
    userId,
    updateUserCollectibles,
    hasCollectibles,
    collectibleList,
    ethCollectibleList,
    solanaCollectibleList,
    collectiblesMetadata,
    isUserOnTheirProfile,
    allowUpdates,
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
    if (allowUpdates && userId) {
      // There was a previous bug where NFTs may have been duplicated.
      // To be on the safe side and ensure that this doesn't happen anymore,
      // we turn the order array into a set, then back into an array.
      const dedupedCollectiblesMetadata = {
        ...collectiblesMetadata,
        order: dedupe(collectiblesMetadata?.order ?? [])
      }
      updateUserCollectibles({
        userId,
        collectibles: dedupedCollectiblesMetadata
      })
    }
  }, [
    setIsEditingPreferences,
    updateUserCollectibles,
    allowUpdates,
    userId,
    collectiblesMetadata
  ])

  const handleShowCollectible = useCallback(
    (id: string) => () => {
      setCollectiblesMetadata({
        ...collectiblesMetadata,
        order: dedupe((collectiblesMetadata?.order ?? []).concat(id))
      })
    },
    [setCollectiblesMetadata, collectiblesMetadata]
  )

  const handleHideCollectible = useCallback(
    (id: string) => () => {
      setCollectiblesMetadata({
        ...collectiblesMetadata,
        [id]: collectiblesMetadata?.id ?? {},
        order: dedupe(
          (collectiblesMetadata?.order ?? []).filter(
            (tokenId) => tokenId !== id
          )
        )
      })
    },
    [setCollectiblesMetadata, collectiblesMetadata]
  )

  const shareUrl = useMemo(() => {
    if (profile === null) return ''
    return getCopyableLink(
      `/${profile.handle}/collectibles${
        embedCollectibleHash ? `/${embedCollectibleHash}` : ''
      }`
    )
  }, [profile, embedCollectibleHash])

  const embedUrl = useMemo(() => {
    if (profile === null) return ''
    return `${BASE_EMBED_URL}/${profile.handle}/collectibles${
      embedCollectibleHash ? `/${embedCollectibleHash}` : ''
    }`
  }, [profile, embedCollectibleHash])

  const embedIFrameUrl = useMemo(() => {
    if (embedUrl === '') return ''
    return `<iframe src=${embedUrl} width="100%" height="480" allow="encrypted-media" style="border: none;"></iframe>`
  }, [embedUrl])

  const copyEmbedLink = () => copyToClipboard(embedIFrameUrl)

  const closeEmbedModal = () => {
    setIsEmbedModalOpen(false)
    setEmbedCollectibleHash(null)
  }

  const handleShareClick = useCallback(() => {
    copyToClipboard(shareUrl)
    toast(collectibleMessages.copied)
  }, [shareUrl, toast])

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
      order: dedupe(
        newCollectibleList
          .map((c) => c.id)
          .filter((id) => (collectiblesMetadata?.order || []).includes(id))
      )
    })
  }

  const getVisibleCollectibles = useCallback(() => {
    if (collectibleList) {
      if (!hasCollectibles && collectiblesMetadata?.order === undefined) {
        return dedupe(collectibleList)
      }

      const collectibleMap: {
        [key: string]: Collectible
      } = collectibleList.reduce(
        (acc, curr) => ({ ...acc, [curr.id]: curr }),
        {}
      )
      const collectibleKeySet = new Set(Object.keys(collectibleMap))

      const visible = dedupe(collectiblesMetadata?.order ?? [])
        .filter((id) => collectibleKeySet.has(id))
        .map((id) => collectibleMap[id])
      return visible || []
    }
    return []
  }, [collectiblesMetadata, collectibleList, hasCollectibles])

  const getHiddenCollectibles = useCallback(() => {
    if (collectibleList) {
      const visibleCollectibleKeySet = new Set(
        getVisibleCollectibles().map((c) => c.id)
      )
      return dedupe(
        collectibleList.filter((c) => !visibleCollectibleKeySet.has(c.id))
      )
    }
    return []
  }, [getVisibleCollectibles, collectibleList])

  // On first mount, if the route matches a collectible id route,
  // trigger the modal to open.
  // Afterwards, allow the user to trigger opening the modal only.
  const collectible = useSelector(getCollectible)
  const [hasSetDeepLinkedCollectible, setHasSetDeepLinkedCollectible] =
    useState(false)

  // Handle rendering details modal based on route
  useEffect(() => {
    const match = doesMatchRoute(
      history.location,
      PROFILE_PAGE_COLLECTIBLE_DETAILS
    )
    if (match) {
      // Ignore needed bc typescript doesn't think that match.params has collectibleId property
      // @ts-ignore
      const collectibleId = match.params.collectibleId ?? null

      // If the URL matches a collectible ID and we haven't set a collectible in the
      // store yet, open up the modal
      if (collectibleId && !hasSetDeepLinkedCollectible) {
        const collectibleFromUrl =
          getVisibleCollectibles().find(
            (c) => getHash(c.id) === collectibleId
          ) ?? null
        if (collectibleFromUrl && profile) {
          dispatch(
            setCollectible({
              collectible: collectibleFromUrl,
              ownerHandle: profile.handle,
              embedCollectibleHash,
              isUserOnTheirProfile,
              updateProfilePicture,
              onSave,
              setIsEmbedModalOpen,
              onClose: () => setEmbedCollectibleHash(null)
            })
          )
          setIsDetailsModalOpen(true)
          setEmbedCollectibleHash(collectibleId)
          setHasSetDeepLinkedCollectible(true)
        }
      }
    }
  }, [
    hasSetDeepLinkedCollectible,
    setHasSetDeepLinkedCollectible,
    collectible,
    dispatch,
    getVisibleCollectibles,
    setIsDetailsModalOpen,
    embedCollectibleHash,
    profile,
    isUserOnTheirProfile,
    updateProfilePicture,
    onSave,
    setIsEmbedModalOpen,
    history.location
  ])

  const overflowMenuItems: PopupMenuItem[] = [
    {
      text: 'Share',
      onClick: handleShareClick
    },
    {
      text: 'Embed',
      onClick: () => setIsEmbedModalOpen(true)
    }
  ]

  if (isUserOnTheirProfile) {
    overflowMenuItems.unshift({
      text: 'Edit',
      onClick: handleEditClick
    })
  }
  const mainContentRef = useMainContentRef()

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
                <UserBadges className={styles.badges} userId={userId} />
              )}
            </div>
          </div>

          {isMobile ? (
            <Flex gap='s' w='100%'>
              {isUserOnTheirProfile && (
                <Button
                  variant='secondary'
                  size='small'
                  onClick={handleEditClick}
                  iconLeft={IconPencil}
                  fullWidth
                >
                  Edit
                </Button>
              )}
              <Button
                variant='secondary'
                size='small'
                onClick={handleShareClick}
                iconLeft={IconShare}
                fullWidth
              >
                Share
              </Button>
            </Flex>
          ) : (
            <PopupMenu
              items={overflowMenuItems}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              renderTrigger={(anchorRef, triggerPopup) => (
                <Button
                  variant='secondary'
                  size='small'
                  iconLeft={IconKebabHorizontal}
                  aria-label={collectibleMessages.collectibleOptions}
                  ref={anchorRef}
                  onClick={() => triggerPopup()}
                />
              )}
              zIndex={zIndex.NAVIGATOR_POPUP}
            />
          )}
        </div>

        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.spinnerContainer}>
              <LoadingSpinner className={styles.spinner} />
            </div>
          ) : !getVisibleCollectibles().length && isUserOnTheirProfile ? (
            <div className={styles.noVisibleCollectible}>
              {collectibleMessages.noVisibleCollectible}
            </div>
          ) : (
            <div className={styles.container}>
              <WindowScroller scrollElement={mainContentRef.current}>
                {({ height, isScrolling, onChildScroll, scrollTop }) => {
                  const collectibles = chunk(getVisibleCollectibles(), 3)
                  return (
                    <AutoSizer disableHeight>
                      {({ width }) => (
                        <ColumnSizer
                          width={width}
                          columnCount={
                            collectibles[0] ? collectibles[0].length : 0
                          }
                        >
                          {({
                            adjustedWidth,
                            getColumnWidth,
                            registerChild
                          }) => (
                            <Grid
                              ref={registerChild}
                              autoHeight
                              width={adjustedWidth}
                              height={height}
                              isScrolling={isScrolling}
                              onScroll={onChildScroll}
                              scrollTop={scrollTop}
                              rowCount={collectibles.length}
                              columnCount={
                                collectibles[0] ? collectibles[0].length : 0
                              }
                              rowHeight={274}
                              columnWidth={getColumnWidth}
                              cellRenderer={({
                                key,
                                rowIndex,
                                columnIndex,
                                style
                              }) => {
                                const collectible =
                                  collectibles[rowIndex][columnIndex]
                                return (
                                  <div key={key} style={style}>
                                    {collectible ? (
                                      <CollectibleDetails
                                        collectible={collectible}
                                        onClick={setEmbedCollectibleHash}
                                      />
                                    ) : null}
                                  </div>
                                )
                              }}
                            />
                          )}
                        </ColumnSizer>
                      )}
                    </AutoSizer>
                  )
                }}
              </WindowScroller>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isEditingPreferences}
        onClose={() => setIsEditingPreferences(false)}
        size='large'
      >
        <ModalHeader>
          <ModalTitle title={collectibleMessages.sortCollectibles} />
        </ModalHeader>
        <ModalContent>
          <Flex gap='m' h={600}>
            {getVisibleCollectibles().length > 0 && (
              <div className={styles.editListSection}>
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className={styles.editListHeader}>
                    <Text variant='title' size='l'>
                      {collectibleMessages.visibleCollectibles}
                    </Text>
                  </div>

                  <div
                    className={cn(
                      styles.editTableContainer,
                      editTableContainerClass,
                      {
                        [styles.tableTopShadow]: showVisibleTableTopShadow,
                        [styles.tableBottomShadow]:
                          showVisibleTableBottomShadow,
                        [styles.tableVerticalShadow]:
                          showVisibleTableTopShadow &&
                          showVisibleTableBottomShadow
                      }
                    )}
                    ref={visibleTableRef}
                  >
                    <Droppable droppableId={VISIBLE_COLLECTIBLES_DROPPABLE_ID}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
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
                  <Text variant='title' size='l'>
                    {collectibleMessages.hiddenCollectibles}
                  </Text>
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
                  {getHiddenCollectibles().map((c) => (
                    <HiddenCollectibleRow
                      key={c.id}
                      collectible={c}
                      onShowClick={handleShowCollectible(c.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </Flex>
        </ModalContent>
        <Flex justifyContent='center' pb='xl'>
          <Button
            variant='primary'
            onClick={handleDoneClick}
            disabled={isUpdatingUserCollectibles}
          >
            Done
          </Button>
        </Flex>
      </Modal>

      <Modal
        isOpen={isEmbedModalOpen}
        onClose={closeEmbedModal}
        showDismissButton
        showTitleHeader
        title={collectibleMessages.embedCollectibles}
        bodyClassName={styles.embedModalBody}
        titleClassName={styles.embedModalTitle}
        headerContainerClassName={styles.embedModalHeader}
        allowScroll
        zIndex={zIndex.COLLECTIBLE_EMBED_VIEW_MODAL}
      >
        <div className={styles.embedContainer}>
          <EmbedFrame
            className={styles.embedFrame}
            frameString={embedIFrameUrl}
          />
          <div className={styles.embedDetails}>
            <div className={styles.embedDetailsTitle}>Embed Code</div>
            <div className={styles.embedTextPanel}>
              <Toast
                text={collectibleMessages.copied}
                fillParent={false}
                mount={MountPlacement.PARENT}
                placement={ComponentPlacement.TOP}
                requireAccount={false}
                tooltipClassName={styles.embedTooltip}
              >
                <div
                  className={styles.embedCopyWrapper}
                  onClick={copyEmbedLink}
                >
                  <div className={styles.embedCopyContainer}>
                    <div className={styles.embedCopyLink}>{embedIFrameUrl}</div>
                  </div>
                  <div className={styles.embedClickText}>
                    {collectibleMessages.clickCopy}
                  </div>
                </div>
              </Toast>
              <Button variant='primary' onClick={closeEmbedModal}>
                {collectibleMessages.done}
              </Button>
            </div>
          </div>
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
