jest.mock('services/audius-backend', () => ({
  fetchCID: jest.fn().mockImplementation((cid) => cid)
}))
