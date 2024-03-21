import { Component, useState, useCallback } from 'react'

import { createRemixOfMetadata } from '@audius/common/schemas'
import { FeatureFlags } from '@audius/common/services'
import {
  creativeCommons,
  getCanonicalName,
  GENRES,
  convertGenreLabelToValue
} from '@audius/common/utils'
import { Button, Switch, IconIndent } from '@audius/harmony'
import cn from 'classnames'
import PropTypes from 'prop-types'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

import {
  AiAttributionModal,
  AiAttributionButton
} from 'components/ai-attribution-modal'
import { MenuFormCallbackStatus } from 'components/data-entry/ContextualMenu'
import DropdownInput from 'components/data-entry/DropdownInput'
import Input from 'components/data-entry/Input'
import LabeledInput from 'components/data-entry/LabeledInput'
import TagInput from 'components/data-entry/TagInput'
import TextArea from 'components/data-entry/TextArea'
import Dropdown from 'components/navigation/Dropdown'
import ConnectedRemixSettingsModal from 'components/remix-settings-modal/ConnectedRemixSettingsModal'
import { RemixSettingsModalTrigger } from 'components/remix-settings-modal/RemixSettingsModalTrigger'
import PreviewButton from 'components/upload/PreviewButton'
import UploadArtwork from 'components/upload/UploadArtwork'
import { useFlag } from 'hooks/useRemoteConfig'
import { moodMap } from 'utils/Moods'
import { resizeImage } from 'utils/imageProcessingUtil'

import { AccessAndSaleTriggerLegacy } from './AccessAndSaleTriggerLegacy'
import styles from './FormTile.module.css'
import { ReleaseDateTriggerLegacy } from './ReleaseDateTriggerLegacy'
import { StemsAndDownloadsTriggerLegacy } from './StemsAndDownloadsTriggerLegacy'

const {
  ALL_RIGHTS_RESERVED_TYPE,
  computeLicense,
  computeLicenseVariables,
  getDescriptionForType
} = creativeCommons

const MOODS = Object.keys(moodMap).map((k) => ({ text: k, el: moodMap[k] }))

const messages = {
  genre: 'Pick a Genre',
  mood: 'Pick a Mood',
  description: 'Description',
  public: 'Public (Default)',
  specialAccess: 'Special Access',
  collectibleGated: 'Collectible Gated',
  hidden: 'Hidden',
  thisIsARemix: 'This is a Remix',
  editRemix: 'Edit',
  trackVisibility: 'Track Visibility',
  availability: 'Availability'
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
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )
  const {
    remixSettingsModalVisible,
    setRemixSettingsModalVisible,
    aiAttributionModalVisible,
    setAiAttributionModalVisible,
    isRemix,
    setIsRemix
  } = props

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
            size='large'
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
                props.onChangeField('genre', convertGenreLabelToValue(value))
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

  const renderRemixSettingsModal = () => {
    return (
      <ConnectedRemixSettingsModal
        initialTrackId={
          props.defaultFields.remix_of?.tracks?.[0]?.parent_track_id
        }
        isStreamGated={props.defaultFields.is_stream_gated ?? false}
        streamConditions={props.defaultFields.stream_conditions ?? null}
        isRemix={isRemix}
        setIsRemix={setIsRemix}
        isOpen={remixSettingsModalVisible}
        onClose={(trackId) => {
          if (!trackId) {
            setIsRemix(false)
            props.onChangeField('remix_of', null)
          } else if (isRemix) {
            props.onChangeField(
              'remix_of',
              createRemixOfMetadata({ parentTrackId: trackId })
            )
          }
          setRemixSettingsModalVisible(false)
        }}
        onChangeField={props.onChangeField}
      />
    )
  }

  const renderAiAttributionModal = () => {
    return (
      <AiAttributionModal
        isOpen={aiAttributionModalVisible}
        onClose={() => setAiAttributionModalVisible(false)}
      />
    )
  }
  const { onChangeField } = props
  const handleRemixToggle = useCallback(() => {
    setIsRemix(!isRemix)
    if (!isRemix) setRemixSettingsModalVisible(true)
    if (isRemix) {
      onChangeField('remix_of', null)
    }
  }, [isRemix, setIsRemix, setRemixSettingsModalVisible, onChangeField])

  const renderRemixSwitch = () => {
    const shouldRender = props.type === 'track' && !isGatedContentEnabled
    return (
      shouldRender && (
        <div className={styles.remixSwitch}>
          <div className={styles.remixText}>{messages.thisIsARemix}</div>
          <Switch checked={isRemix} onChange={handleRemixToggle} />
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

  const renderStemsAndDownloadsTriggerLegacy = () => {
    return (
      <StemsAndDownloadsTriggerLegacy
        onAddStems={props.onAddStems}
        stems={props.stems}
        onSelectCategory={props.onSelectStemCategory}
        onDeleteStem={props.onDeleteStem}
        fields={props.defaultFields}
        onChangeField={props.onChangeField}
        lastGateKeeper={props.lastGateKeeper}
        setLastGateKeeper={props.setLastGateKeeper}
        initialForm={props.initialForm}
        closeMenuCallback={(data) => {
          if (data === MenuFormCallbackStatus.OPEN_ACCESS_AND_SALE) {
            props.setForceOpenAccessAndSale(true)
          }
        }}
      />
    )
  }

  const renderAdvancedButton = () => {
    return (
      <Button
        variant='common'
        size='small'
        className={cn(styles.menuButton, styles.advancedButton)}
        name={props.advancedShow ? 'showAdvanced' : 'hideAdvanced'}
        iconLeft={IconIndent}
        onClick={props.toggleAdvanced}
      >
        {props.advancedShow ? 'Hide Advanced' : 'Show Advanced'}
      </Button>
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
          {renderStemsAndDownloadsTriggerLegacy()}
          {renderAdvancedButton()}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.basicContainer}>
      {renderBasicForm()}
      {renderBottomMenu()}
      {!isGatedContentEnabled && renderRemixSettingsModal()}
      {renderAiAttributionModal()}
    </div>
  )
}

const AdvancedForm = (props) => {
  const { isEnabled: isGatedContentEnabled } = useFlag(
    FeatureFlags.GATED_CONTENT_ENABLED
  )
  const { isEnabled: isScheduledReleasesEnabled } = useFlag(
    FeatureFlags.SCHEDULED_RELEASES
  )

  const {
    remixSettingsModalVisible,
    setRemixSettingsModalVisible,
    aiAttributionModalVisible,
    setAiAttributionModalVisible,
    isRemix,
    setIsRemix
  } = props

  let availabilityState = {
    is_stream_gated: props.defaultFields.is_stream_gated,
    stream_conditions: props.defaultFields.stream_conditions,
    preview_start_seconds: props.defaultFields.preview_start_seconds,
    is_download_gated: props.defaultFields.is_download_gated,
    download_conditions: props.defaultFields.download_conditions,
    is_downloadable: props.defaultFields.is_downloadable
  }

  const releaseDateState = {
    is_unlisted: props.defaultFields.is_unlisted,
    is_scheduled_release: props.defaultFields.is_scheduled_release,
    release_date: props.defaultFields.release_date
  }

  const showAvailability = props.type === 'track' && props.showUnlistedToggle
  if (showAvailability) {
    availabilityState = {
      ...availabilityState,
      scheduled_release: props.defaultFields.is_scheduled_release,
      unlisted: props.defaultFields.is_unlisted,
      genre: props.defaultFields.field_visibility.genre,
      mood: props.defaultFields.field_visibility.mood,
      tags: props.defaultFields.field_visibility.tags,
      share: props.defaultFields.field_visibility.share,
      plays: props.defaultFields.field_visibility.play_count
    }
  }

  const [hideRemixes, setHideRemixes] = useState(
    !(props.defaultFields?.field_visibility?.remixes ?? true)
  )

  // TODO: migrate this logic into the new modal before merge
  // Update fields in the metadata.
  const didUpdateAvailabilityState = (newState) => {
    props.onChangeField('is_unlisted', newState.unlisted)
    props.onChangeField('field_visibility', {
      genre: newState.genre,
      mood: newState.mood,
      tags: newState.tags,
      share: newState.share,
      play_count: newState.plays,
      remixes: !hideRemixes
    })
    props.onChangeField('is_stream_gated', newState.is_stream_gated)

    // Check whether the field is invalid if track is collectible-gated
    // so that the user cannot proceed until they pick an nft collection.
    const isInvalidNFTCollection =
      'nft_collection' in (newState.stream_conditions ?? {}) &&
      !newState.stream_conditions?.nft_collection
    props.onChangeField(
      'stream_conditions',
      newState.stream_conditions,
      isInvalidNFTCollection
    )
    props.onChangeField('preview_start_seconds', newState.preview_start_seconds)
  }

  const didUpdateReleaseDate = (newState) => {
    props.onChangeField('release_date', newState.release_date)
    props.onChangeField('is_unlisted', newState.is_unlisted)
    props.onChangeField('is_scheduled_release', newState.is_unlisted)
  }

  const didToggleHideRemixesState = () => {
    props.onChangeField('field_visibility', {
      genre:
        availabilityState?.genre ??
        props.defaultFields?.field_visibility?.genre ??
        true,
      mood:
        availabilityState?.mood ??
        props.defaultFields?.field_visibility?.mood ??
        true,
      tags:
        availabilityState?.tags ??
        props.defaultFields?.field_visibility?.tags ??
        true,
      share:
        availabilityState?.share ??
        props.defaultFields?.field_visibility?.share ??
        true,
      play_count:
        availabilityState?.plays ??
        props.defaultFields?.field_visibility?.play_count ??
        true,
      remixes: hideRemixes
    })
    setHideRemixes(!hideRemixes)
  }

  const renderRemixSettingsModal = () => {
    return (
      <ConnectedRemixSettingsModal
        initialTrackId={
          props.defaultFields.remix_of?.tracks?.[0]?.parent_track_id
        }
        isStreamGated={props.defaultFields.is_stream_gated ?? false}
        streamConditions={props.defaultFields.stream_conditions ?? null}
        isRemix={isRemix}
        setIsRemix={setIsRemix}
        isOpen={remixSettingsModalVisible}
        onClose={(trackId) => {
          if (!trackId) {
            setIsRemix(false)
            props.onChangeField('remix_of', null)
          } else if (isRemix) {
            props.onChangeField(
              'remix_of',
              createRemixOfMetadata({ parentTrackId: trackId })
            )
          }
          setRemixSettingsModalVisible(false)
        }}
        onChangeField={props.onChangeField}
        hideRemixes={hideRemixes}
        onToggleHideRemixes={didToggleHideRemixesState}
      />
    )
  }

  const renderAiAttributionModal = () => {
    return (
      <AiAttributionModal
        isOpen={aiAttributionModalVisible}
        onClose={() => setAiAttributionModalVisible(false)}
        onChange={(aiAttributionUserId) =>
          props.onChangeField('ai_attribution_user_id', aiAttributionUserId)
        }
      />
    )
  }

  return (
    <>
      <div
        className={cn(styles.advanced, {
          [styles.show]: props.advancedShow,
          [styles.visible]: props.advancedVisible
        })}
      >
        <Divider label='' />
        <div className={styles.release}>
          <div className={styles.datePicker}>
            {/* <DatePicker
              defaultDate={
                props.defaultFields.release_date ||
                props.defaultFields.created_at
              }
              onDateChange={(value, invalid) =>
                props.onChangeField('release_date', value, invalid)
              }
            /> */}
          </div>
          {showAvailability && (
            <AccessAndSaleTriggerLegacy
              didUpdateState={didUpdateAvailabilityState}
              metadataState={availabilityState}
              trackLength={props.trackLength}
              isRemix={!!props.defaultFields.remix_of?.tracks?.length}
              isUpload={props.isUpload}
              initialForm={props.initialForm}
              forceOpen={props.forceOpenAccessAndSale}
              setForceOpen={props.setForceOpenAccessAndSale}
              lastGateKeeper={props.lastGateKeeper}
              setLastGateKeeper={props.setLastGateKeeper}
            />
          )}
          {props.type === 'track' && (
            <RemixSettingsModalTrigger
              className={styles.releaseButton}
              onClick={() => props.setRemixSettingsModalVisible(true)}
              hideRemixes={hideRemixes}
              handleToggle={didToggleHideRemixesState}
            />
          )}
          {props.type === 'track' && (
            <AiAttributionButton
              className={styles.releaseButton}
              onClick={() => setAiAttributionModalVisible(true)}
            />
          )}
          {isScheduledReleasesEnabled && (
            <ReleaseDateTriggerLegacy
              didUpdateState={didUpdateReleaseDate}
              metadataState={releaseDateState}
              initialForm={props.initialForm}
            />
          )}
          {props.type !== 'track' && (
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
        {isGatedContentEnabled && renderRemixSettingsModal()}
        {renderAiAttributionModal()}
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

    imageProcessingError: false,

    remixSettingsModalVisible: false,
    aiAttributionModalVisible: false,
    isRemix: !!this.props.defaultFields.remix_of,
    forceOpenAccessAndSale: false,
    lastGateKeeper: {}
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
      file.name = selectedFiles[0].name
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

  setRemixSettingsModalVisible = (visible) => {
    this.setState({ remixSettingsModalVisible: visible })
  }

  setAiAttributionModalVisible = (visible) => {
    this.setState({ aiAttributionModalVisible: visible })
  }

  setIsRemix = (isRemix) => {
    this.setState({ isRemix })
  }

  setForceOpenAccessAndSale = (forceOpen) => {
    this.setState({ forceOpenAccessAndSale: forceOpen })
  }

  setLastGateKeeper = (lastGateKeeper) => {
    this.setState({ lastGateKeeper })
  }

  render() {
    const {
      advancedShow,
      advancedVisible,
      license,
      imageProcessingError,
      allowAttribution,
      commercialUse,
      derivativeWorks,
      remixSettingsModalVisible,
      aiAttributionModalVisible,
      isRemix
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
          remixSettingsModalVisible={remixSettingsModalVisible}
          setRemixSettingsModalVisible={this.setRemixSettingsModalVisible}
          aiAttributionModalVisible={aiAttributionModalVisible}
          setAiAttributionModalVisible={this.setAiAttributionModalVisible}
          isRemix={isRemix}
          setIsRemix={this.setIsRemix}
          forceOpenAccessAndSale={this.state.forceOpenAccessAndSale}
          setForceOpenAccessAndSale={this.setForceOpenAccessAndSale}
          lastGateKeeper={this.state.lastGateKeeper}
          setLastGateKeeper={this.setLastGateKeeper}
        />
        <AdvancedForm
          {...this.props}
          toggleAdvanced={this.toggleAdvanced}
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
          remixSettingsModalVisible={remixSettingsModalVisible}
          setRemixSettingsModalVisible={this.setRemixSettingsModalVisible}
          aiAttributionModalVisible={aiAttributionModalVisible}
          setAiAttributionModalVisible={this.setAiAttributionModalVisible}
          isRemix={isRemix}
          setIsRemix={this.setIsRemix}
          forceOpenAccessAndSale={this.state.forceOpenAccessAndSale}
          setForceOpenAccessAndSale={this.setForceOpenAccessAndSale}
          lastGateKeeper={this.state.lastGateKeeper}
          setLastGateKeeper={this.setLastGateKeeper}
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

  /** Whether we are in the track upload flow */
  isUpload: PropTypes.bool,

  /** Initial form for in case we are in the edit track modal */
  initialForm: PropTypes.object,

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
   * Track length in seconds
   */
  trackLength: PropTypes.number,

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
  isUpload: true,
  initialForm: {},
  showUnlistedToggle: true,
  showHideTrackSectionInModal: true,
  children: [],
  stems: [],
  onSelectStemCategory: () => {}
}

export default FormTile
