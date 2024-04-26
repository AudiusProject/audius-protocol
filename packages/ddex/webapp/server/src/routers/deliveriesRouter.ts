import { router } from '../trpc'

import { makeListCollection } from './helpers'

const DELIVERIES_COLLECTION = 'deliveries'

const deliveriesRouter = router({
  getDeliveries: makeListCollection(DELIVERIES_COLLECTION)
})

export default deliveriesRouter
