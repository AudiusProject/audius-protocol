const assert = require('assert')

// Module under test
const Utils = require('../src/utils')

// Partially tested test file!!

describe('test src/utils.js', () => {
  it('Current node should handle transcode if TranscodingQueue has room', function () {
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        spID: 1
      }),
      true
    )
  })

  it('Current node should handle transcode if spID is not initialized', function () {
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: true,
        spID: null
      }),
      true
    )
  })

  it('Current node should not handle transcode if there is no room in TranscodingQueue and spID is initialized', function () {
    assert.strictEqual(
      Utils.currentNodeShouldHandleTranscode({
        transcodingQueueCanAcceptMoreJobs: false,
        spID: 1
      }),
      false
    )
  })
})
