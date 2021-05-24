import React from 'react'
import CollectionPageProvider from './CollectionPageProvider'
import { connect } from 'react-redux'
import { isMobile } from 'utils/clientUtil'
import { AppState } from 'store/types'
import { CollectionsPageType } from './store/types'

import MobileCollectionPage from './components/mobile/CollectionPage'
import DesktopCollectionPage from './components/desktop/CollectionPage'
import { SmartCollection } from 'models/Collection'

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
      type={type}
    >
      {content}
    </CollectionPageProvider>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

export default connect(mapStateToProps)(CollectionPage)
