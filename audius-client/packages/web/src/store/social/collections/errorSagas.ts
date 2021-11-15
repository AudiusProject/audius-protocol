import createErrorSagas from 'common/utils/errorSagas'

import * as socialCollectionActions from '../../../common/store/social/collections/actions'

type CollectionErrors =
  | ReturnType<typeof socialCollectionActions.repostCollectionFailed>
  | ReturnType<typeof socialCollectionActions.saveCollectionFailed>

const errorSagas = createErrorSagas<CollectionErrors>({
  errorTypes: [
    socialCollectionActions.REPOST_COLLECTION_FAILED,
    socialCollectionActions.SAVE_COLLECTION_FAILED,
    socialCollectionActions.UNSAVE_COLLECTION_FAILED
  ],
  getShouldRedirect: () => false,
  getShouldReport: () => true,
  getAdditionalInfo: (action: CollectionErrors) => ({
    error: action.error,
    collectionId: action.collectionId
  })
})

export default errorSagas
