const assert = require('assert')

// Module under test
const Utils = require('../src/utils')

// Partially tested test file!!

describe('test src/utils.js', () => {
  it('Current node should handle transcode if TranscodingQueue has room', function () {
    const mockLibs = {}
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        libs: mockLibs,
        spID: 1
      }),
      true
    )
  })

  it('Current node should handle transcode if spID is not initialized', function () {
    const mockLibs = {}
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        libs: mockLibs,
        spID: null
      }),
      true
    )
  })

  it('Current node should handle transcode if libs is not set', function () {
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: false,
        libs: null,
        spID: 1
      }),
      true
    )

    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: false,
        libs: undefined,
        spID: 1
      }),
      true
    )
  })

  it('Current node should not handle transcode if there is no room in TranscodingQueue, spID is initialized, and libs is initialized', function () {
    const mockLibs = {}
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: false,
        libs: mockLibs,
        spID: 1
      }),
      false
    )
  })
})
