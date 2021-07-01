import React, { useState, useCallback, useRef } from 'react'

import { Button, ButtonType } from '@audius/stems'
import PropTypes from 'prop-types'

import { ReactComponent as IconSearch } from 'assets/img/iconSearch.svg'
import TabSlider from 'components/data-entry/TabSlider'
import Popup from 'components/general/Popup'
import Dropzone from 'components/upload/Dropzone'
import InvalidFileType from 'components/upload/InvalidFileType'
import RandomImage from 'services/RandomImage'

import styles from './ImageSelectionPopup.module.css'
import { ImageSelectionProps, ImageSelectionDefaults } from './PropTypes'

const POPULAR_TERMS = ['neon', 'space', 'beach', 'nature', 'abstract']

const messages = {
  uploadYourOwn: 'Upload Your Own',
  findArtwork: 'Find Artwork',
  search: 'SEARCH',
  searchAgain: 'SEARCH AGAIN',
  orTry: 'or try',
  fromUnsplash: 'Photos from Unsplash',
  addImage: 'Add Image'
}

const DropzonePage = ({ error, onSelect }) => {
  const onDropzoneSelect = useCallback(file => onSelect(file, 'original'), [
    onSelect
  ])
  return (
    <div className={styles.dropzonePage}>
      <Dropzone
        type='image'
        className={styles.dropzone}
        iconClassName={styles.dropzoneIcon}
        allowMultiple={false}
        onDrop={onDropzoneSelect}
      />
      {error ? <InvalidFileType className={styles.invalidFileType} /> : null}
    </div>
  )
}

const RandomPage = ({ onSelect }) => {
  const [randomPhotoQuery, setRandomPhotoQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const inputRef = useRef(null)

  const getRandomPhoto = async query => {
    setSearched(true)
    const value = RandomImage.get(query)
    if (value) {
      await onSelect(value, 'unsplash')
    }
  }

  const onKeyDown = e => {
    if (e.key === 'Enter') {
      getRandomPhoto(randomPhotoQuery)
    }
  }

  const onClickTerm = term => {
    setRandomPhotoQuery(term)
    getRandomPhoto(term)
  }

  return (
    <div className={styles.random}>
      <div className={styles.query}>
        <IconSearch className={styles.iconSearch} />
        <input
          ref={inputRef}
          placeholder='Search Images'
          type='text'
          value={randomPhotoQuery}
          onChange={e => {
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
        <span className={styles.try}>{messages.orTry}</span>
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

/**
 * A popup that lets a user upload artwork or select a random image.
 */
const ImageSelectionPopup = ({
  className,
  isVisible,
  error,
  onClose,
  onAfterClose,
  onSelect
}) => {
  const [page, setPage] = useState(messages.uploadYourOwn)

  const handleClose = () => {
    setPage(messages.uploadYourOwn)
    onClose()
  }

  return (
    <Popup
      className={className}
      isVisible={isVisible}
      onClose={handleClose}
      onAfterClose={onAfterClose}
      title={messages.addImage}
    >
      <TabSlider
        className={styles.slider}
        options={[
          {
            key: messages.uploadYourOwn,
            text: messages.uploadYourOwn
          },
          {
            key: messages.findArtwork,
            text: messages.findArtwork
          }
        ]}
        selected={page}
        onSelectOption={setPage}
      />
      {page === messages.findArtwork ? (
        <RandomPage onSelect={onSelect} />
      ) : (
        <DropzonePage error={error} onSelect={onSelect} />
      )}
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
