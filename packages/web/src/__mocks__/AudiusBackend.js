jest.mock('services/AudiusBackend', () => ({
  fetchCID: jest.fn().mockImplementation(cid => cid),
  recordTrackListen: jest.fn(),
  getSelectableCreatorNodes: jest.fn()
}))
