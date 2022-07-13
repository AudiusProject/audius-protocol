import { connect } from 'react-redux'

import { SmartCollection } from 'common/models/Collection'
import { AppState } from 'store/types'
import { isMobile } from 'utils/clientUtil'

import { CollectionsPageType } from '../../common/store/pages/collection/types'

import CollectionPageProvider from './CollectionPageProvider'
import DesktopCollectionPage from './components/desktop/CollectionPage'
import MobileCollectionPage from './components/mobile/CollectionPage'

type OwnProps = {
  type: CollectionsPageType
  smartCollection?: SmartCollection
}

const isMobileClient = isMobile()

type CollectionPageProps = ReturnType<typeof mapStateToProps> & OwnProps

const CollectionPage = ({ type, smartCollection }: CollectionPageProps) => {
  const content = isMobileClient ? MobileCollectionPage : DesktopCollectionPage

  return (
    <CollectionPageProvider
      isMobile={isMobileClient}
      smartCollection={smartCollection}
      type={type}>
      {content}
    </CollectionPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

export default connect(mapStateToProps)(CollectionPage)
