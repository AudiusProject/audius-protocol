import { useEffect } from 'react'

import { useCurrentAccount } from '@audius/common/api'
import { SmartCollectionVariant } from '@audius/common/models'
import {
  smartCollectionPageSelectors,
  smartCollectionPageActions,
  playlistLibraryHelpers
} from '@audius/common/store'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import CollectionPage from 'pages/collection-page/CollectionPage'
import { AppState } from 'store/types'
const { fetchSmartCollection } = smartCollectionPageActions
const { getCollection } = smartCollectionPageSelectors
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
  fetch
}: SmartCollectionPageProps) => {
  const { data: playlistLibrary } = useCurrentAccount({
    select: (account) => account?.playlistLibrary
  })

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
    collection: getCollection(state, { variant: ownProps.variant })
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    fetch: (variant: SmartCollectionVariant) =>
      dispatch(fetchSmartCollection({ variant }))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SmartCollectionPage)
