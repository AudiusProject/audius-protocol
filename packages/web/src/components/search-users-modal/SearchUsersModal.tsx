import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'

import { useProxySelector } from '@audius/common/hooks'
import { Status, ID, User } from '@audius/common/models'
import {
  cacheUsersSelectors,
  searchUsersModalActions,
  searchUsersModalSelectors
} from '@audius/common/store'
import {
  IconButton,
  IconRemove,
  IconSearch,
  Modal,
  ModalHeader,
  ModalProps,
  ModalTitle,
  ModalTitleProps,
  Scrollbar
} from '@audius/stems'
import InfiniteScroll from 'react-infinite-scroller'
import { useDispatch, useSelector } from 'react-redux'
import { useDebounce } from 'react-use'

import {
  InputV2,
  InputV2Size,
  InputV2Variant
} from 'components/data-entry/InputV2'
import LoadingSpinner from 'components/loading-spinner/LoadingSpinner'

import styles from './SearchUsersModal.module.css'

const messages = {
  searchUsers: 'Search Users'
}

const DEBOUNCE_MS = 100

const { searchUsers } = searchUsersModalActions
const { getUserList, getLastSearchQuery } = searchUsersModalSelectors
const { getUsers } = cacheUsersSelectors

type SearchUsersModalProps = {
  titleProps: ModalTitleProps
  debounceMs?: number
  defaultUserList?: {
    userIds: ID[]
    loadMore: () => void
    loading: boolean
    hasMore: boolean
  }
  renderEmpty?: () => ReactNode
  renderUser: (user: User, closeParentModal: () => void) => ReactNode
  onCancel?: () => void
} & Omit<ModalProps, 'children'>

export const SearchUsersModal = (props: SearchUsersModalProps) => {
  const {
    titleProps,
    debounceMs = DEBOUNCE_MS,
    defaultUserList = {
      userIds: [],
      loading: false,
      loadMore: () => {},
      hasMore: false
    },
    renderUser,
    renderEmpty = () => null,
    isOpen,
    onClose,
    onClosed,
    onCancel
  } = props
  const dispatch = useDispatch()
  const [query, setQuery] = useState('')
  const [hasQuery, setHasQuery] = useState(false)
  const scrollParentRef = useRef<HTMLElement | null>(null)

  const { userIds, hasMore, status } = useSelector(getUserList)
  const lastSearchQuery = useSelector(getLastSearchQuery)
  const users = useProxySelector(
    (state) => {
      const ids = hasQuery ? userIds : defaultUserList.userIds
      const users = getUsers(state, { ids })
      return ids.map((id) => users[id])
    },
    [hasQuery, userIds, isOpen]
  )

  useDebounce(
    () => {
      dispatch(searchUsers({ query }))
      setHasQuery(!!query)
    },
    debounceMs,
    [query, setHasQuery, dispatch]
  )

  const handleClose = useCallback(() => {
    setQuery('')
    onClose()
  }, [onClose])

  const handleCancel = useCallback(() => {
    handleClose()
    onCancel?.()
  }, [handleClose, onCancel])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value)
    },
    [setQuery]
  )

  const handleLoadMore = useCallback(() => {
    if (status === Status.LOADING || defaultUserList.loading) {
      return
    }
    if (hasQuery) {
      dispatch(searchUsers({ query }))
    } else {
      defaultUserList.loadMore()
    }
  }, [hasQuery, query, status, defaultUserList, dispatch])

  // Clear the query if something else resets our search state
  useEffect(() => {
    if (!lastSearchQuery) {
      setQuery('')
    }
  }, [lastSearchQuery, setQuery])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} onClosed={onClosed}>
      <ModalHeader onClose={handleCancel}>
        <ModalTitle {...titleProps}></ModalTitle>
      </ModalHeader>
      <div className={styles.modalContent}>
        <div className={styles.search}>
          <InputV2
            inputRef={(el) => el?.focus()}
            variant={InputV2Variant.ELEVATED_PLACEHOLDER}
            label={messages.searchUsers}
            size={InputV2Size.LARGE}
            value={query}
            onChange={handleChange}
          >
            {query ? (
              <IconButton
                icon={<IconRemove className={styles.iconLight} />}
                aria-label='Clear Search'
                onClick={() => {
                  setQuery('')
                }}
              />
            ) : (
              <IconSearch className={styles.iconLight} />
            )}
          </InputV2>
        </div>
        <Scrollbar
          className={styles.results}
          containerRef={(containerRef) => {
            scrollParentRef.current = containerRef
          }}
        >
          <InfiniteScroll
            loadMore={handleLoadMore}
            useWindow={false}
            initialLoad
            hasMore={hasQuery ? hasMore : defaultUserList.hasMore}
            getScrollParent={() => scrollParentRef.current}
            loader={<LoadingSpinner className={styles.spinner} />}
            threshold={48}
          >
            {!hasQuery &&
            !defaultUserList.loading &&
            defaultUserList.userIds.length === 0
              ? renderEmpty()
              : users.map((user) => renderUser(user, handleClose))}
          </InfiniteScroll>
        </Scrollbar>
      </div>
    </Modal>
  )
}
