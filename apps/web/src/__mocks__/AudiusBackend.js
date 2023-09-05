jest.mock('common/services/AudiusBackend', () => ({
  recordTrackListen: jest.fn(),
  getSelectableCreatorNodes: jest.fn(),
  submitAndEvaluateAttestations: jest.fn()
}))
