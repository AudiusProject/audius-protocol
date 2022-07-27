import { useEffect } from 'react'

import { SmartCollectionVariant } from '@audius/common'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import { getPlaylistLibrary } from 'common/store/account/selectors'
import { getCollection } from 'common/store/pages/smart-collection/selectors'
import { fetchSmartCollection } from 'common/store/pages/smart-collection/slice'
import { findInPlaylistLibrary } from 'common/store/playlist-library/helpers'
import CollectionPage from 'pages/collection-page/CollectionPage'
import { AppState } from 'store/types'

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
