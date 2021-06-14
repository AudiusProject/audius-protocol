import React, { useEffect } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'

import { AppState } from 'store/types'
import { SmartCollectionVariant } from './types'
import { getCollection } from './store/selectors'
import CollectionPage from 'containers/collection-page/CollectionPage'
import { fetchSmartCollection } from './store/slice'
import { getPlaylistLibrary } from 'store/account/selectors'
import { findInPlaylistLibrary } from 'store/playlist-library/helpers'

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
