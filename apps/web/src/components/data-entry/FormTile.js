import { Component, useState, useCallback } from 'react'

import {
  GENRES,
  ELECTRONIC_PREFIX,
  getCanonicalName,
  createRemixOfMetadata
} from '@audius/common'
import { Button, ButtonType, IconDownload, IconIndent } from '@audius/stems'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import DatePicker from 'components/data-entry/DatePicker'
import DropdownInput from 'components/data-entry/DropdownInput'
import Input from 'components/data-entry/Input'
import LabeledInput from 'components/data-entry/LabeledInput'
import TagInput from 'components/data-entry/TagInput'
import TextArea from 'components/data-entry/TextArea'
import LabeledButton from 'components/labeled-button/LabeledButton'
import Dropdown from 'components/navigation/Dropdown'
import ConnectedRemixSettingsModal from 'components/remix-settings-modal/ConnectedRemixSettingsModal'
import SourceFilesModal from 'components/source-files-modal/SourceFilesModal'
import Switch from 'components/switch/Switch'
import UnlistedTrackModal from 'components/unlisted-track-modal/UnlistedTrackModal'
import PreviewButton from 'components/upload/PreviewButton'
import UploadArtwork from 'components/upload/UploadArtwork'
import {
  ALL_RIGHTS_RESERVED_TYPE,
  computeLicense,
  computeLicenseVariables,
  getDescriptionForType
} from 'utils/creativeCommonsUtil'
import { resizeImage } from 'utils/imageProcessingUtil'
import { moodMap } from 'utils/moods'

import styles from './FormTile.module.css'

const MOODS = Object.keys(moodMap).map((k) => ({ text: k, el: moodMap[k] }))

const messages = {
  genre: 'Pick a Genre',
  mood: 'Pick a Mood',
  description: 'Description',
  hidden: 'Hidden',
  public: 'Public (default)',
  thisIsARemix: 'This is a Remix',
  editRemix: 'Edit',
  hideRemixes: 'Hide Remixes on Track Page'
}

const Divider = (props) => {
  return (
    <div className={styles.divider}>
      {props.label ? <div className={styles.label}>{props.label}</div> : null}
      <div className={styles.border} />
    </div>
  )
}

const BasicForm = (props) => {
  const onPreviewClick = props.playing
    ? props.onStopPreview
    : props.onPlayPreview

  const renderBasicForm = () => {
    return (
      <div className={styles.basic}>
        <div className={styles.preview}>
          <UploadArtwork
            artworkUrl={
              props.defaultFields.artwork
                ? props.defaultFields.artwork.url
                : props.coverArt
            }
            onDropArtwork={props.onDropArtwork}
            error={props.invalidFields.artwork}
            imageProcessingError={props.imageProcessingError}
            onOpenPopup={props.onOpenArtworkPopup}
            onClosePopup={props.onCloseArtworkPopup}
          />
        </div>
        <div className={styles.form}>
          <div className={styles.trackName}>
            <Input
              name='name'
              id='track-name-input'
              placeholder={`${
                props.type.charAt(0).toUpperCase() + props.type.slice(1)
              } Name`}
              defaultValue={
                props.isPlaylist
                  ? props.defaultFields.playlist_name
                  : props.defaultFields.title
              }
              isRequired={
                props.isPlaylist
                  ? props.requiredFields.playlist_name
                  : props.requiredFields.title
              }
              characterLimit={64}
              error={
                props.isPlaylist
                  ? props.invalidFields.playlist_name
                  : props.invalidFields.title
              }
              variant={'elevatedPlaceholder'}
              onChange={(value) =>
                props.onChangeField(
                  props.isPlaylist ? 'playlist_name' : 'title',
                  value
                )
              }
            />
          </div>
          <div className={styles.categorization}>
            <DropdownInput
              aria-label={messages.genre}
              placeholder={messages.genre}
              mount='parent'
              menu={{ items: GENRES }}
              defaultValue={getCanonicalName(props.defaultFields.genre) || ''}
              isRequired={props.requiredFields.genre}
              error={props.invalidFields.genre}
              onSelect={(value) =>
                props.onChangeField(
                  'genre',
                  value.replace(ELECTRONIC_PREFIX, '')
                )
              }
              size='large'
            />
            <DropdownInput
              placeholder='Pick a Mood'
              mount='parent'
              menu={{ items: MOODS }}
              defaultValue={props.defaultFields.mood || ''}
              isRequired={props.requiredFields.mood}
              error={props.invalidFields.mood}
              onSelect={(value) => props.onChangeField('mood', value)}
              size='large'
            />
          </div>
          <div className={styles.tags}>
            <TagInput
              defaultTags={(props.defaultFields.tags || '')
                .split(',')
                .filter((t) => t)}
              onChangeTags={(value) =>
                props.onChangeField('tags', [...value].join(','))
              }
            />
          </div>
          <div className={styles.description}>
            <TextArea
              className={styles.textArea}
              placeholder='Description'
              defaultValue={props.defaultFields.description || ''}
              onChange={(value) => props.onChangeField('description', value)}
              characterLimit={1000}
            />
          </div>
        </div>
      </div>
    )
  }

  const [remixSettingsModalVisible, setRemixSettingsModalVisible] =
    useState(false)
  const [isRemix, setIsRemix] = useState(!!props.defaultFields.remix_of)

  const renderRemixSettingsModal = () => {
    return (
      <ConnectedRemixSettingsModal
        initialTrackId={
          props.defaultFields.remix_of?.tracks?.[0]?.parent_track_id
        }
        isOpen={remixSettingsModalVisible}
        onClose={(trackId) => {
          if (!trackId) {
            setIsRemix(false)
            props.onChangeField('remix_of', null)
          } else {
            props.onChangeField(
              'remix_of',
              createRemixOfMetadata({ parentTrackId: trackId })
            )
          }
          setRemixSettingsModalVisible(false)
        }}
      />
    )
  }

  const { onChangeField } = props
  const handleRemixToggle = useCallback(() => {
    setIsRemix((isRemix) => !isRemix)
    if (!isRemix) setRemixSettingsModalVisible(true)
    if (isRemix) {
      onChangeField('remix_of', null)
    }
  }, [isRemix, setIsRemix, onChangeField])

  const renderRemixSwitch = () => {
    const shouldRender = props.type === 'track'
    return (
      shouldRender && (
        <div className={styles.remixSwitch}>
          <div className={styles.remixText}>{messages.thisIsARemix}</div>
          <Switch isOn={isRemix} handleToggle={handleRemixToggle} />
          {isRemix && (
            <div
              className={styles.remixEdit}
              onClick={() => setRemixSettingsModalVisible(true)}
            >
              {messages.editRemix}
            </div>
          )}
        </div>
      )
    )
  }

  const [sourceFilesModalVisible, setSourceFilesModalVisible] = useState(false)

  const renderSourceFilesModal = () => {
    return (
      <SourceFilesModal
        downloadSettings={props.defaultFields.download}
        onUpdateDownloadSettings={(settings) =>
          props.onChangeField('download', settings)
        }
        isOpen={sourceFilesModalVisible}
        onClose={() => setSourceFilesModalVisible(false)}
        onAddStems={props.onAddStems}
        stems={props.stems}
        onSelectCategory={props.onSelectStemCategory}
        onDeleteStem={props.onDeleteStem}
      />
    )
  }

  const renderDownloadButton = () => {
    const shouldRender = props.type === 'track'
    return (
      shouldRender && (
        <Button
          type={ButtonType.COMMON_ALT}
          className={styles.menuButton}
          textClassName={styles.menuButtonText}
          iconClassName={styles.menuButtonIcon}
          name='DownloadAndSource'
          text='Downloads & Source Files'
          leftIcon={<IconDownload />}
          onClick={() => setSourceFilesModalVisible(true)}
        />
      )
    )
  }

  const renderAdvancedButton = () => {
    return (
      <Button
        className={cn(styles.menuButton, styles.advancedButton)}
        textClassName={styles.menuButtonText}
        iconClassName={styles.menuButtonIcon}
        type={ButtonType.COMMON_ALT}
        name={props.advancedShow ? 'showAdvanced' : 'hideAdvanced'}
        text={props.advancedShow ? 'Hide Advanced' : 'Show Advanced'}
        leftIcon={<IconIndent />}
        onClick={props.toggleAdvanced}
      />
    )
  }

  const renderBottomMenu = () => {
    return (
      <div className={styles.menu}>
        {props.type === 'track' && props.showPreview ? (
          <div>
            <PreviewButton playing={props.playing} onClick={onPreviewClick} />
          </div>
        ) : null}
        <div
          className={cn(styles.floatRight, {
            [styles.hasPreview]: props.showPreview
          })}
        >
          {renderRemixSwitch()}
          {renderDownloadButton()}
          {renderAdvancedButton()}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.basicContainer}>
      {renderBasicForm()}
      {renderBottomMenu()}
      {renderSourceFilesModal()}
      {renderRemixSettingsModal()}
    </div>
  )
}

const AdvancedForm = (props) => {
  let unlistedState
  let unlistedButtonTitle
  const showUnlisted = props.type === 'track' && props.showUnlistedToggle
  if (showUnlisted) {
    unlistedState = {
      unlisted: props.defaultFields.is_unlisted,
      genre: props.defaultFields.field_visibility.genre,
      mood: props.defaultFields.field_visibility.mood,
      tags: props.defaultFields.field_visibility.tags,
      share: props.defaultFields.field_visibility.share,
      plays: props.defaultFields.field_visibility.play_count
    }
    unlistedButtonTitle = unlistedState.unlisted
      ? messages.hidden
      : messages.public
  }

  const [isUnlistedModalOpen, setIsUnlistedModalOpen] = useState(false)
  const [hideRemixes, setHideRemixes] = useState(
    !(props.defaultFields?.field_visibility?.remixes ?? true)
  )

  // Need to update two fields in the metadata.
  const didUpdateUnlistedState = (newState) => {
    props.onChangeField('is_unlisted', newState.unlisted)
    props.onChangeField('field_visibility', {
      genre: newState.genre,
      mood: newState.mood,
      tags: newState.tags,
      share: newState.share,
      play_count: newState.plays,
      remixes: !hideRemixes
    })
  }

  const didToggleHideRemixesState = () => {
    props.onChangeField('field_visibility', {
      genre:
        unlistedState?.genre ??
        props.defaultFields?.field_visibility?.genre ??
        true,
      mood:
        unlistedState?.mood ??
        props.defaultFields?.field_visibility?.mood ??
        true,
      tags:
        unlistedState?.tags ??
        props.defaultFields?.field_visibility?.tags ??
        true,
      share:
        unlistedState?.share ??
        props.defaultFields?.field_visibility?.share ??
        true,
      play_count:
        unlistedState?.plays ??
        props.defaultFields?.field_visibility?.play_count ??
        true,
      remixes: hideRemixes
    })
    setHideRemixes((hideRemixes) => !hideRemixes)
  }

  return (
    <>
      {showUnlisted && (
        <UnlistedTrackModal
          showHideTrackSwitch={props.showHideTrackSectionInModal}
          isOpen={isUnlistedModalOpen}
          onClose={() => setIsUnlistedModalOpen(false)}
          didUpdateState={didUpdateUnlistedState}
          metadataState={unlistedState}
        />
      )}
      <div
        className={cn(styles.advanced, {
          [styles.show]: props.advancedShow,
          [styles.visible]: props.advancedVisible
        })}
      >
        <Divider label='' />
        <div className={styles.release}>
          {showUnlisted && (
            <LabeledButton
              type={ButtonType.COMMON_ALT}
              name='setUnlisted'
              text={unlistedButtonTitle}
              label='Track Visibility'
              className={styles.hiddenTrackButton}
              textClassName={styles.hiddenTrackButtonText}
              onClick={() => {
                setIsUnlistedModalOpen(true)
              }}
            />
          )}
          <div className={styles.datePicker}>
            <DatePicker
              defaultDate={
                props.defaultFields.release_date ||
                props.defaultFields.created_at
              }
              onDateChange={(value, invalid) =>
                props.onChangeField('release_date', value, invalid)
              }
            />
          </div>
          {props.type === 'track' ? (
            <div className={styles.hideRemixes}>
              <div className={styles.hideRemixesText}>
                {messages.hideRemixes}
              </div>
              <Switch
                isOn={hideRemixes}
                handleToggle={didToggleHideRemixesState}
              />
            </div>
          ) : (
            <LabeledInput
              label='UPC'
              placeholder='e.g. 123456789012'
              defaultValue={props.defaultFields.upc || ''}
              size='small'
              onChange={(value) => props.onChangeField('upc', value)}
            />
          )}
        </div>
        {props.type === 'track' ? (
          <div className={styles.trackId}>
            <LabeledInput
              label='Track ISRC'
              placeholder='e.g. CC-XXX-YY-NNNNN'
              defaultValue={props.defaultFields.isrc || ''}
              onChange={(value) => props.onChangeField('isrc', value)}
              size='small'
            />
            <LabeledInput
              label='Track ISWC'
              placeholder='e.g. T-345246800-1'
              defaultValue={props.defaultFields.iswc || ''}
              onChange={(value) => props.onChangeField('iswc', value)}
              size='small'
            />
          </div>
        ) : null}
        <Divider label='License Type' />
        <div className={styles.licenseMenus}>
          <div className={styles.attribution}>
            <Dropdown
              label='Allow Attribution?'
              size='medium'
              variant='border'
              menu={{
                items: [
                  { text: 'Allow Attribution' },
                  { text: 'No Attribution' }
                ]
              }}
              defaultIndex={props.allowAttribution ? 0 : 1}
              onSelect={props.onSelectAllowAttribution}
            />
          </div>
          <div className={styles.commercial}>
            <Dropdown
              label='Commercial Use?'
              size='medium'
              variant='border'
              menu={{
                items: [{ text: 'Commercial Use' }, { text: 'Non Commercial' }]
              }}
              defaultIndex={props.commercialUse ? 0 : 1}
              onSelect={props.onSelectCommercialUse}
            />
          </div>
          <div className={styles.derive}>
            <Dropdown
              label='Derivative Works?'
              size='medium'
              variant='border'
              menu={{
                items: [
                  { text: 'No Selection' },
                  { text: 'Share-Alike' },
                  { text: 'No Derivative Works' }
                ]
              }}
              defaultIndex={
                props.derivativeWorks === null
                  ? 0
                  : props.derivativeWorks
                  ? 1
                  : 2
              }
              onSelect={props.onSelectDerivativeWorks}
            />
          </div>
        </div>
        <div className={styles.licenseInfo}>
          {props.licenseType}
          <br />
          {props.licenseDescription}
        </div>
      </div>
    </>
  )
}

class FormTile extends Component {
  state = {
    advancedShow: false,
    advancedVisible: false,
    advancedAnimationTimeout: null,

    license: {
      licenseType: this.props.defaultFields.license || ALL_RIGHTS_RESERVED_TYPE,
      licenseDescription: getDescriptionForType(
        this.props.defaultFields.license || ALL_RIGHTS_RESERVED_TYPE
      )
    },
    ...computeLicenseVariables(this.props.defaultFields.license),

    children: this.props.children,
    // eslint-disable-next-line
    childrenOrder: Array.apply(null, {
      length: this.props.children ? this.props.children.length : 0
    }).map(Number.call, Number),

    imageProcessingError: false
  }

  componentDidMount() {
    this.props.onChangeField('license', this.state.license.licenseType)
  }

  componentWillUnmount() {
    clearTimeout(this.state.advancedAnimationTimeout)
  }

  onSelectAllowAttribution = (value) => {
    let allowAttribution = true
    if (value === 'No Attribution') allowAttribution = false
    const license = computeLicense(
      allowAttribution,
      this.state.commercialUse,
      this.state.derivativeWorks
    )
    this.setState({
      allowAttribution,
      license
    })
    this.props.onChangeField('license', license.licenseType)
  }

  onSelectCommercialUse = (value) => {
    let commercialUse = true
    if (value === 'Non Commercial') commercialUse = false
    const license = computeLicense(
      this.state.allowAttribution,
      commercialUse,
      this.state.derivativeWorks
    )
    this.setState({
      commercialUse,
      license
    })
    this.props.onChangeField('license', license.licenseType)
  }

  onSelectDerivativeWorks = (value) => {
    let derivativeWorks = null
    if (value === 'Share-Alike') derivativeWorks = true
    else if (value === 'No Derivative Works') derivativeWorks = false
    const license = computeLicense(
      this.state.allowAttribution,
      this.state.commercialUse,
      derivativeWorks
    )
    this.setState({
      derivativeWorks,
      license
    })
    this.props.onChangeField('license', license.licenseType)
  }

  onDropArtwork = async (selectedFiles, source) => {
    try {
      let file = selectedFiles[0]
      file = await this.props.transformArtworkFunction(file)
      const url = URL.createObjectURL(file)
      this.props.onChangeField('artwork', { url, file, source }, false)
      this.setState({ imageProcessingError: false })
    } catch (err) {
      const {
        defaultFields: { artwork }
      } = this.props
      this.props.onChangeField('artwork', { ...artwork }, false)
      this.setState({ imageProcessingError: true })
    }
  }

  toggleAdvanced = () => {
    let advancedAnimationTimeout = null
    if (this.state.advancedShow) {
      clearTimeout(this.state.advancedAnimationTimeout)
      this.setState({ advancedVisible: false })
    } else {
      advancedAnimationTimeout = setTimeout(() => {
        this.setState({ advancedVisible: true })
      }, 180)
    }
    this.setState({
      advancedShow: !this.state.advancedShow,
      advancedAnimationTimeout
    })
  }

  onDragEnd = (result) => {
    const { destination, source, draggableId } = result

    if (!source || !destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return

    const newOrder = Array.from(this.state.childrenOrder)
    newOrder.splice(source.index, 1)
    newOrder.splice(destination.index, 0, parseInt(draggableId))
    this.setState({ childrenOrder: newOrder })
    this.props.onChangeOrder(source.index, destination.index)
  }

  render() {
    const {
      advancedShow,
      advancedVisible,
      license,
      imageProcessingError,
      allowAttribution,
      commercialUse,
      derivativeWorks
    } = this.state

    const { licenseType, licenseDescription } = license
    return (
      <div className={styles.formTile}>
        <BasicForm
          {...this.props}
          toggleAdvanced={this.toggleAdvanced}
          advancedShow={advancedShow}
          onDropArtwork={this.onDropArtwork}
          imageProcessingError={imageProcessingError}
        />
        <AdvancedForm
          {...this.props}
          advancedShow={advancedShow}
          advancedVisible={advancedVisible}
          licenseType={licenseType}
          licenseDescription={licenseDescription}
          allowAttribution={allowAttribution}
          commercialUse={commercialUse}
          derivativeWorks={derivativeWorks}
          onSelectAllowAttribution={this.onSelectAllowAttribution}
          onSelectCommercialUse={this.onSelectCommercialUse}
          onSelectDerivativeWorks={this.onSelectDerivativeWorks}
        />
        {this.props.children.length > 0 ? (
          <DragDropContext onDragEnd={this.onDragEnd}>
            <div className={styles.children}>
              <Droppable droppableId='droppable-1' type='TRACK'>
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {this.state.childrenOrder.map((index, i) => {
                      return (
                        <Draggable
                          key={this.props.children[index].key}
                          draggableId={index.toString()}
                          index={i}
                        >
                          {(provided, snapshot) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              {this.props.children[i]}
                            </div>
                          )}
                        </Draggable>
                      )
                    })}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        ) : null}
      </div>
    )
  }
}

FormTile.propTypes = {
  defaultFields: PropTypes.object,
  invalidFields: PropTypes.object,
  requiredFields: PropTypes.object,
  /** The image returned from useTrackCoverArt */
  coverArt: PropTypes.string,
  /** If image processing resulted in an error. */
  imageProcessingError: PropTypes.bool,
  isPlaylist: PropTypes.bool,
  onChangeField: PropTypes.func,
  onChangeOrder: PropTypes.func,
  /** Whether or not to show a preview button. */
  showPreview: PropTypes.bool,
  /** Whether or not the preview is playing. */
  playing: PropTypes.bool,
  type: PropTypes.oneOf(['track', 'album', 'playlist']),
  /** Transform artwork function to apply. */
  transformArtworkFunction: PropTypes.func,

  /** Whether to show the unlisted/public button the modal */
  showUnlistedToggle: PropTypes.bool,
  /** In the unlisted visibility modal, do we let the user toggle
   * unlisted/public, or just set field visibility?
   */
  showHideTrackSectionInModal: PropTypes.bool,

  /**
   * Handle stem selection.
   * Accepts a list of stems.
   */
  onAddStems: PropTypes.func,

  /**
   * Optional array of stems to display
   * in the download selection modal.
   */
  stems: PropTypes.array,

  /**
   * Optional callback for selecting a stem category.
   * Of the form (category, stemIndex) => void
   */
  onSelectStemCategory: PropTypes.func,

  /** function of type (index) => void */
  onDeleteStem: PropTypes.func,

  /** callback when artwork popup is opened */
  onOpenArtworkPopup: PropTypes.func,

  /** callback when artwork popup is closed */
  onCloseArtworkPopup: PropTypes.func
}

FormTile.defaultProps = {
  showPreview: true,
  type: 'track',
  isPlaylist: false,
  transformArtworkFunction: resizeImage,
  onChangeOrder: () => {},
  onChangeField: () => {},
  showUnlistedToggle: true,
  showHideTrackSectionInModal: true,
  children: [],
  stems: [],
  onSelectStemCategory: () => {}
}

export default FormTile
