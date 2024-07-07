import { modalsSelectors } from '@audius/common/store'
import cn from 'classnames'
import { connect } from 'react-redux'
import { Dispatch } from 'redux'

import AddToCollectionPage from 'components/add-to-collection/mobile/AddToCollection'
import useScrollLock from 'hooks/useScrollLock'
import { AppState } from 'store/types'

import styles from './TopLevelPage.module.css'
const { getModalVisibility } = modalsSelectors

type TopLevelPageProps = ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const rootElement =
  typeof document !== 'undefined' ? document.querySelector('#root') : null

const TopLevelPage = ({ showAddToCollection }: TopLevelPageProps) => {
  const isLocked = !!(showAddToCollection && rootElement)
  useScrollLock(isLocked)

  let page = null
  if (showAddToCollection) {
    page = <AddToCollectionPage />
  }

  return (
    <div
      className={cn(styles.topLevelPage, {
        [styles.show]: showAddToCollection,
        [styles.darkerBackground]: showAddToCollection
      })}
    >
      {page}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    showAddToCollection: getModalVisibility(state, 'AddToCollection')
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {}
}

export default connect(mapStateToProps, mapDispatchToProps)(TopLevelPage)
