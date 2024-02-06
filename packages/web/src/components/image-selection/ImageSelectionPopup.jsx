import { useState, useCallback, useRef, useContext } from 'react'

import { useSelectTierInfo } from '@audius/common/hooks'
import { RandomImage } from '@audius/common/services'
import { accountSelectors, badgeTiers } from '@audius/common/store'
import { removeNullable } from '@audius/common/utils'
import { IconSearch } from '@audius/harmony'
import { Button, ButtonType, Popup, SegmentedControl } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'
import { useWindowSize } from 'react-use'

import { Dropzone } from 'components/upload/Dropzone'
import InvalidFileType from 'components/upload/InvalidFileType'
import { MainContentContext } from 'pages/MainContentContext'
import { MIN_COLLECTIBLES_TIER } from 'pages/profile-page/ProfilePageProvider'
import zIndex from 'utils/zIndex'

import styles from './ImageSelectionPopup.module.css'
import { ImageSelectionProps, ImageSelectionDefaults } from './PropTypes'
const getAccountUser = accountSelectors.getAccountUser

const COLLECTIBLES_PER_PAGE = 15
const POPULAR_TERMS = ['neon', 'space', 'beach', 'nature', 'abstract']

const messages = {
  uploadYourOwn: 'Upload',
  findArtwork: 'Find Artwork',
  yourCollectibles: 'Your Collectibles',
  suggestionHeader: 'Suggested Searches',
  search: 'Search',
  searchAgain: 'Search Again',
  fromUnsplash: 'Photos from Unsplash',
  popupTitle: 'Add Artwork'
}

const DropzonePage = ({ error, onSelect }) => {
  const onDropzoneSelect = useCallback(
    (file) => onSelect(file, 'original'),
    [onSelect]
  )
  return (
    <div className={styles.dropzonePage}>
      <Dropzone
        type='image'
        className={styles.dropzone}
        iconClassName={styles.dropzoneIcon}
        allowMultiple={false}
        onDropAccepted={onDropzoneSelect}
      />
      {error ? <InvalidFileType className={styles.invalidFileType} /> : null}
    </div>
  )
}

const RandomPage = ({ onSelect }) => {
  const [randomPhotoQuery, setRandomPhotoQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)

  const getRandomPhoto = async (query) => {
    setSearched(true)
    const value = RandomImage.get(query)
    if (value) {
      await onSelect(value, 'unsplash')
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      getRandomPhoto(randomPhotoQuery)
    }
  }

  const onClickTerm = (term) => {
    setRandomPhotoQuery(term)
    getRandomPhoto(term)
  }

  return (
    <div className={styles.random}>
      <div className={styles.query}>
        <IconSearch color='default' className={styles.iconSearch} />
        <input
          ref={inputRef}
          placeholder='Search Images'
          type='text'
          value={randomPhotoQuery}
          onChange={(e) => {
            setRandomPhotoQuery(e.target.value)
          }}
          onKeyDown={onKeyDown}
        />
      </div>
      <div className={styles.buttonWrapper}>
        <Button
          className={styles.button}
          textClassName={styles.buttonText}
          type={ButtonType.PRIMARY_ALT}
          text={searched ? messages.searchAgain : messages.search}
          onClick={() => getRandomPhoto(randomPhotoQuery)}
        />
      </div>
      <div className={styles.suggestion}>
        <div className={styles.suggestionHeader}>
          {messages.suggestionHeader}
        </div>
        <span className={styles.terms}>
          {POPULAR_TERMS.map((term, i) => {
            return (
              <span key={term}>
                <span className={styles.term} onClick={() => onClickTerm(term)}>
                  {term}
                </span>
                {i !== POPULAR_TERMS.length - 1 && (
                  <span className={styles.comma}>,</span>
                )}
              </span>
            )
          })}
        </span>
        <div className={styles.credit}>{messages.fromUnsplash}</div>
      </div>
    </div>
  )
}

const CollectionPage = ({ onSelect, source }) => {
  const refs = useRef({})
  const [loadedImgs, setLoadedImgs] = useState([])
  const [page, setPage] = useState(1)
  const { collectibles, collectibleList, solanaCollectibleList } =
    useSelector(getAccountUser)
  const allCollectibles = [
    ...(collectibleList || []),
    ...(solanaCollectibleList || [])
  ]
  const collectibleIdMap = allCollectibles.reduce((acc, c) => {
    acc[c.id] = c
    return acc
  }, {})

  const visibleCollectibles = collectibles?.order
    ? collectibles.order
        .map((id) => collectibleIdMap[id])
        .filter(removeNullable)
    : allCollectibles

  const imgs = visibleCollectibles.filter((c) => c.mediaType === 'IMAGE')
  const maxPages = Math.ceil(imgs.length / COLLECTIBLES_PER_PAGE)

  const prevPage = () => {
    if (page > 1) setPage(page - 1)
  }
  const nextPage = () => {
    if (page < maxPages) setPage(page + 1)
  }

  const selectImg = (imageUrl) => {
    onSelect(
      fetch(imageUrl).then((r) => r.blob()),
      'url'
    )
  }

  return (
    <div className={styles.collection}>
      <div className={styles.collectiblesContainer}>
        {imgs
          .slice(
            COLLECTIBLES_PER_PAGE * (page - 1),
            COLLECTIBLES_PER_PAGE * page
          )
          .map((collectible, i) => (
            <img
              ref={(ref) => {
                refs.current[collectible.id + '_' + i] = ref
              }}
              key={collectible.id + '_' + i}
              className={cn(styles.collectibleImg, {
                [styles.profileImg]: source === 'ProfilePicture',
                [styles.fadeIn]:
                  refs.current[collectible.id + '_' + i]?.complete ||
                  loadedImgs.includes(collectible.imageUrl)
              })}
              src={collectible.imageUrl}
              onLoad={() =>
                setLoadedImgs([...loadedImgs, collectible.imageUrl])
              }
              onClick={() => selectImg(collectible.imageUrl)}
            />
          ))}
      </div>
      {maxPages > 1 && (
        <div className={styles.collectiblesControls}>
          {page > 1 ? (
            <div className={styles.prevLabel} onClick={prevPage}>
              PREV
            </div>
          ) : (
            <div />
          )}
          <div className={styles.pageLabel}>
            {page}/{maxPages}
          </div>
          {page < maxPages ? (
            <div className={styles.nextLabel} onClick={nextPage}>
              NEXT
            </div>
          ) : (
            <div />
          )}
        </div>
      )}
    </div>
  )
}

/**
 * A popup that lets a user upload artwork or select a random image.
 */
const ImageSelectionPopup = ({
  anchorRef,
  className,
  isVisible,
  error,
  onClose,
  onAfterClose,
  onSelect,
  source
}) => {
  const { mainContentRef } = useContext(MainContentContext)
  const [page, setPage] = useState(messages.uploadYourOwn)
  const windowSize = useWindowSize()
  const {
    collectibles,
    collectibleList,
    solanaCollectibleList,
    user_id: userId
  } = useSelector(getAccountUser)

  const { tierNumber } = useSelectTierInfo(userId ?? 0)
  const isCollectibleOptionEnabled =
    tierNumber >= badgeTiers.findIndex((t) => t.tier === MIN_COLLECTIBLES_TIER)

  const allCollectibles = [
    ...(collectibleList || []),
    ...(solanaCollectibleList || [])
  ]
  const visibleCollectibles = collectibles?.order
    ? allCollectibles.filter((c) => collectibles?.order?.includes(c.id))
    : allCollectibles

  const handleClose = () => {
    setPage(messages.uploadYourOwn)
    onClose()
  }

  const pageMap = {
    [messages.uploadYourOwn]: (
      <DropzonePage error={error} onSelect={onSelect} />
    ),
    [messages.findArtwork]: <RandomPage onSelect={onSelect} />,
    [messages.yourCollectibles]: (
      <CollectionPage onSelect={onSelect} source={source} />
    )
  }

  const tabSliderOptions = [
    {
      key: messages.uploadYourOwn,
      text: messages.uploadYourOwn
    },
    {
      key: messages.findArtwork,
      text: messages.findArtwork
    }
  ]
  if (isCollectibleOptionEnabled && visibleCollectibles.length) {
    tabSliderOptions.push({
      key: messages.yourCollectibles,
      text: messages.yourCollectibles
    })
  }

  let anchorOrigin = { vertical: 'bottom', horizontal: 'center' }
  let transformOrigin = { vertical: 'top', horizontal: 'center' }

  if (windowSize.width >= 1000 || windowSize.height < 820) {
    anchorOrigin = { vertical: 'center', horizontal: 'left' }
    transformOrigin = { vertical: 'center', horizontal: 'right' }
  }

  return (
    <Popup
      anchorRef={anchorRef}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      className={cn(styles.popup, className)}
      isVisible={isVisible}
      onClose={handleClose}
      onAfterClose={onAfterClose}
      showHeader={true}
      title={messages.popupTitle}
      zIndex={zIndex.IMAGE_SELECTION_POPUP}
      containerRef={mainContentRef}
    >
      <SegmentedControl
        className={styles.slider}
        options={tabSliderOptions}
        selected={page}
        onSelectOption={setPage}
      />
      {pageMap[page]}
    </Popup>
  )
}

ImageSelectionPopup.propTypes = {
  className: PropTypes.string,
  isVisible: PropTypes.bool.isRequired,
  ...ImageSelectionProps
}

ImageSelectionPopup.defaultProps = {
  isVisible: true,
  ...ImageSelectionDefaults
}

export default ImageSelectionPopup
