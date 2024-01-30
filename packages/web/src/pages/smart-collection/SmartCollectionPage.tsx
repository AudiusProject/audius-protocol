import { useEffect } from 'react'

import {
  accountSelectors,
  smartCollectionPageSelectors,
  smartCollectionPageActions,
  playlistLibraryHelpers
} from '@audius/common'
import { SmartCollectionVariant } from '@audius/common/models'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import CollectionPage from 'pages/collection-page/CollectionPage'
import { AppState } from 'store/types'
const { fetchSmartCollection } = smartCollectionPageActions
const { getCollection } = smartCollectionPageSelectors
const { getPlaylistLibrary } = accountSelectors
const { findInPlaylistLibrary } = playlistLibraryHelpers

type OwnProps = {
  variant: SmartCollectionVariant
}

type SmartCollectionPageProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const SmartCollectionPage = ({
  variant,
  collection,
  playlistLibrary,
  fetch
}: SmartCollectionPageProps) => {
  useEffect(() => {
    fetch(variant)
  }, [variant, fetch])

  if (collection) {
    collection = {
      ...collection,
      has_current_user_saved: playlistLibrary
        ? !!findInPlaylistLibrary(playlistLibrary, variant)
        : false
    }
  }

  return (
    <CollectionPage
      key={variant}
      type='playlist'
      smartCollection={collection}
    />
  )
}

function mapStateToProps(state: AppState, ownProps: OwnProps) {
  return {
    collection: getCollection(state, { variant: ownProps.variant }),
    playlistLibrary: getPlaylistLibrary(state)
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetch: (variant: SmartCollectionVariant) =>
      dispatch(fetchSmartCollection({ variant }))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SmartCollectionPage)
