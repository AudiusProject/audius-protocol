import { Component } from 'react'

import {
  Name,
  accountSelectors,
  queueActions,
  newCollectionMetadata
} from '@audius/common'
import { push as pushRoute } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Spring } from 'react-spring/renderprops'

import { make } from 'common/store/analytics/actions'
import { openWithDelay } from 'components/first-upload-modal/store/slice'
import Header from 'components/header/desktop/Header'
import Page from 'components/page/Page'
import { dropdownRows as stemRows } from 'components/source-files-modal/SourceFilesModal'
import { processFiles } from 'pages/upload-page/store/utils/processFiles'
import { playlistPage, albumPage, profilePage } from 'utils/route'

import styles from './UploadPage.module.css'
import EditPage from './components/EditPage'
import FinishPage from './components/FinishPage'
import SelectPage from './components/SelectPage'
import UploadType from './components/uploadType'
import {
  uploadTracks,
  reset,
  undoResetState,
  toggleMultiTrackNotification
} from './store/actions'
const { pause: pauseQueue } = queueActions
const getAccountUser = accountSelectors.getAccountUser

const Pages = Object.freeze({
  SELECT: 0,
  EDIT: 1,
  FINISH: 2
})

const SHOW_FIRST_UPLOAD_MODAL_DELAY = 3000

const UploadPage = (props) => {
  const { children, page } = props

  return (
    <Spring
      key={page}
      from={{ opacity: 0.2 }}
      to={{ opacity: 1 }}
      config={{ duration: 200 }}
    >
      {(animProps) => (
        <div className={styles.upload} style={animProps}>
          <div className={styles.pageContent}>{children}</div>
        </div>
      )}
    </Spring>
  )
}

class Upload extends Component {
  state = {
    page: this.props.upload.uploading ? Pages.FINISH : Pages.SELECT,

    uploadType:
      this.props.uploadType ||
      this.props.upload.uploadType ||
      UploadType.INDIVIDUAL_TRACK,

    tracks: this.props.upload.uploading ? this.props.upload.tracks : [],

    // Contains metadata related to the upload itself, e.g. playlist vs. track.
    metadata: this.props.upload.metadata
      ? this.props.upload.metadata
      : newCollectionMetadata({ artwork: { file: null, url: '' } }),

    // An array of array of tracks representing stems per track.
    stems: [],

    preview: null,
    previewIndex: -1,
    uploadTrackerror: null,
    isFirstUpload: false
  }

  componentDidUpdate() {
    if (this.state.preview !== null && this.props.playing) {
      this.stopPreview()
    }
    // If the account is defined and has 0 tracks and we haven't set isFirstUpload yet
    if (
      this.props.account &&
      !this.props.account.track_count &&
      !this.state.isFirstUpload
    ) {
      this.setState({ isFirstUpload: true })
    }

    // Reset the react state, then the store state if shouldReset is true and on Finished page
    if (this.props.upload.shouldReset) {
      if (this.state.page === Pages.FINISH) this.reset()
      this.props.undoResetState()
    }
  }

  componentWillUnmount() {
    if (this.state.preview) this.stopPreview()
    if (
      this.state.page !== Pages.FINISH ||
      (this.state.page === Pages.FINISH && !this.props.upload.uploading)
    ) {
      this.reset()
    }
  }

  changePage = (page) => {
    this.setState({
      page
    })
  }

  invalidAudioFile = (name, reason) => {
    this.setState({ uploadTrackerror: { reason } })
  }

  onSelectTracks = async (selectedFiles) => {
    // Disallow duplicate tracks:
    // Filter out any tracks that already exist in `state.tracks`
    // and any that exist multiple times in `selectedFiles`
    const existing = new Set(
      this.state.tracks.map(({ file }) => `${file.name}-${file.lastModified}`)
    )
    selectedFiles = selectedFiles.filter(({ name, lastModified }) => {
      const id = `${name}-${lastModified}`
      if (existing.has(id)) return false
      existing.add(id)
      return true
    })

    const processedFiles = processFiles(selectedFiles, this.invalidAudioFile)
    const tracks = (await Promise.all(processedFiles)).filter(Boolean)
    if (tracks.length === processedFiles.length) {
      this.setState({ uploadTrackerror: null })
    }

    let uploadType = this.state.uploadType
    if (
      this.state.uploadType === UploadType.INDIVIDUAL_TRACK &&
      this.state.tracks.length + tracks.length > 1
    ) {
      uploadType = UploadType.INDIVIDUAL_TRACKS
    }

    this.setState({
      tracks: [...this.state.tracks, ...tracks],
      uploadType
    })
  }

  onAddStemsToTrack = async (selectedStems, trackIndex) => {
    const processedFiles = processFiles(selectedStems, this.invalidAudioFile)
    const stems = (await Promise.all(processedFiles))
      .filter(Boolean)
      .map((s) => ({
        ...s,
        category: stemRows[0],
        allowDelete: true,
        allowCategorySwitch: true
      }))
    this.setState((s) => {
      const newState = { ...s }
      newState.stems[trackIndex] = [
        ...(newState.stems[trackIndex] ?? []),
        ...stems
      ]
      return newState
    })
  }

  onDeleteStem = (trackIndex, stemIndex) => {
    this.setState((s) => {
      const newState = { ...s }
      const newStems = [...newState.stems[trackIndex]]
      newStems.splice(stemIndex, 1)
      newState.stems[trackIndex] = newStems
      return newState
    })
  }

  onSelectStemCategory = (category, trackIndex, stemIndex) => {
    this.setState((s) => {
      const newState = { ...s }
      newState.stems[trackIndex][stemIndex].category = category
      return newState
    })
  }

  removeTrack = (index) => {
    this.setState({
      tracks: this.state.tracks.filter((_, i) => i !== index),
      uploadType:
        this.state.tracks.length === 2
          ? UploadType.INDIVIDUAL_TRACK
          : this.state.uploadType
    })
  }

  playPreview = (index) => {
    // Stop existing music if some is playing.
    if (this.props.playing) {
      this.props.pauseQueue()
    }

    if (this.state.preview) this.stopPreview()
    const audio = this.state.tracks[index].preview
    audio.play()
    this.setState({ preview: audio, previewIndex: index })
  }

  stopPreview = () => {
    if (this.state.preview) {
      const preview = this.state.preview
      preview.pause()
      preview.currentTime = 0
    }
    this.setState({ preview: null, previewIndex: -1 })
  }

  updateTrack = (field, value, i) => {
    if (i >= this.state.tracks.length) {
      return
    }
    const track = { ...this.state.tracks[i] }
    track.metadata[field] = value
    const newTracks = [...this.state.tracks]
    newTracks[i] = track
    this.setState({ tracks: newTracks })
  }

  updateMetadata = (field, value) => {
    const metadata = { ...this.state.metadata }
    metadata[field] = value
    this.setState({ metadata })
  }

  publish = () => {
    // Set the premium content fields for the tracks
    // so that libs track metadata validation passes.
    // This will change once we introduce premium content UI
    // in the track upload flow.
    const tracks = [...this.state.tracks]
    tracks.forEach((track) => {
      track.metadata.is_premium = false
      track.metadata.premium_conditions = null
    })
    this.props.uploadTracks(
      tracks,
      this.state.metadata,
      this.state.uploadType,
      this.state.stems
    )
    this.changePage(Pages.FINISH)
  }

  reset = () => {
    this.setState({
      page: Pages.SELECT,
      tracks: [],
      preview: null,
      previewIndex: -1,
      uploadType: UploadType.INDIVIDUAL_TRACK,
      metadata: newCollectionMetadata({
        artwork: { file: null, url: '' }
      }),
      uploadTrackerror: null
    })
    this.props.resetUpload()
  }

  setUploadType = (uploadType) => {
    this.setState({ uploadType })
  }

  onChangeOrder = (source, destination) => {
    const movedElement = this.state.tracks[source]
    const newTracks = [...this.state.tracks]

    // Remove the element from it's source location
    newTracks.splice(source, 1)

    // Put the moved guy back in
    newTracks.splice(destination, 0, movedElement)

    this.setState({ tracks: newTracks })
  }

  onVisitCompletionPage = () => {
    const {
      account,
      upload,
      goToRoute,
      openFirstUploadModal,
      onRecordViewCompletionPage
    } = this.props
    const { isFirstUpload } = this.state
    let route = ''
    let uploadType = ''
    if (upload.completionId) {
      switch (this.state.uploadType) {
        case UploadType.INDIVIDUAL_TRACK: {
          route = upload.tracks[0].metadata.permalink
          uploadType = 'track'
          break
        }
        case UploadType.PLAYLIST: {
          const playlistName = upload.metadata.playlist_name
          route = playlistPage(
            account.handle,
            playlistName,
            upload.completionId
          )
          uploadType = 'playlist'
          break
        }
        case UploadType.ALBUM: {
          const albumName = upload.metadata.playlist_name
          route = albumPage(account.handle, albumName, upload.completionId)
          uploadType = 'album'
          break
        }
        default:
          break
      }
    } else {
      uploadType = 'tracks'
      route = profilePage(account.handle)
    }
    const areAnyPublic = upload.tracks.some((t) => !t.metadata.is_unlisted)
    if (isFirstUpload && areAnyPublic) {
      openFirstUploadModal(SHOW_FIRST_UPLOAD_MODAL_DELAY)
    }
    goToRoute(route)
    onRecordViewCompletionPage(uploadType)
  }

  render() {
    const {
      account,
      onCloseMultiTrackNotification,
      upload: { uploadProgress, openMultiTrackNotification, failedTrackIndices }
    } = this.props
    const {
      page,
      tracks,
      metadata,
      uploadType,
      uploadTrackerror,
      isFirstUpload
    } = this.state

    // Only show errored tracks if we're not uploading
    // a collection
    const erroredTracks =
      uploadType === UploadType.INDIVIDUAL_TRACKS ? failedTrackIndices : []

    let headerText
    if (uploadType === UploadType.INDIVIDUAL_TRACKS) {
      headerText = 'Tracks'
    } else if (uploadType === UploadType.PLAYLIST) {
      headerText = 'Playlist'
    } else if (uploadType === UploadType.ALBUM) {
      headerText = 'Album'
    } else {
      headerText = 'Track'
    }

    let currentPage
    let header
    switch (page) {
      case Pages.SELECT:
        header = <Header primary={'Upload Tracks'} />
        currentPage = (
          <SelectPage
            account={account}
            tracks={tracks}
            error={uploadTrackerror}
            uploadType={uploadType}
            setUploadType={this.setUploadType}
            openMultiTrackNotification={openMultiTrackNotification}
            onCloseMultiTrackNotification={onCloseMultiTrackNotification}
            previewIndex={this.state.previewIndex}
            onSelect={this.onSelectTracks}
            onRemove={this.removeTrack}
            playPreview={this.playPreview}
            stopPreview={this.stopPreview}
            onContinue={() => this.changePage(Pages.EDIT)}
          />
        )
        break
      case Pages.EDIT:
        header = (
          <Header
            primary={`Complete Your ${headerText}`}
            showBackButton
            onClickBack={() => this.changePage(Pages.SELECT)}
          />
        )
        currentPage = (
          <EditPage
            metadata={metadata}
            tracks={tracks}
            uploadType={uploadType}
            previewIndex={this.state.previewIndex}
            onPlayPreview={this.playPreview}
            onStopPreview={this.stopPreview}
            updateTrack={this.updateTrack}
            updateMetadata={this.updateMetadata}
            onChangeOrder={this.onChangeOrder}
            onContinue={this.publish}
            onAddStems={this.onAddStemsToTrack}
            onSelectStemCategory={this.onSelectStemCategory}
            stems={this.state.stems}
            onDeleteStem={this.onDeleteStem}
          />
        )
        break
      case Pages.FINISH: {
        const inProgress =
          this.props.upload.uploading || !this.props.upload.success
        const headerPrimary = inProgress
          ? `Complete Your ${headerText}`
          : 'Upload Complete'
        header = <Header primary={headerPrimary} />

        currentPage = (
          <FinishPage
            account={this.props.account ? this.props.account : {}}
            tracks={tracks}
            uploadProgress={uploadProgress}
            metadata={metadata}
            uploadType={uploadType}
            inProgress={inProgress}
            upload={this.props.upload}
            onContinue={this.onVisitCompletionPage}
            erroredTracks={erroredTracks}
            isFirstUpload={isFirstUpload}
          />
        )
        break
      }
      default:
        currentPage = null
        header = null
        break
    }
    return (
      <Page
        title='Upload'
        description='Upload and publish audio content to the Audius platform'
        contentClassName={styles.upload}
        header={header}
      >
        <UploadPage page={page}>{currentPage}</UploadPage>
      </Page>
    )
  }
}

const mapStateToProps = (state) => ({
  account: getAccountUser(state),
  upload: state.upload,
  playing: state.queue.playing
})

const mapDispatchToProps = (dispatch) => ({
  onRecordViewCompletionPage: (uploadType) =>
    dispatch(make(Name.TRACK_UPLOAD_VIEW_TRACK_PAGE, { uploadType })),
  goToRoute: (route) => dispatch(pushRoute(route)),
  undoResetState: () => dispatch(undoResetState()),
  pauseQueue: () => dispatch(pauseQueue({})),
  onCloseMultiTrackNotification: () =>
    dispatch(toggleMultiTrackNotification(false)),
  resetUpload: () => dispatch(reset()),
  uploadTracks: (tracks, metadata, uploadType, stems) =>
    dispatch(uploadTracks(tracks, metadata, uploadType, stems)),
  openFirstUploadModal: (delay) => dispatch(openWithDelay({ delay }))
})

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Upload))
