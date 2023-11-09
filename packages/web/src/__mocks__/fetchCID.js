import { vitest } from 'vitest'

vitest.mock('services/audius-backend', () => ({
  fetchCID: vitest.fn().mockImplementation((cid) => cid)
}))
