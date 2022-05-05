const assert = require('assert')

const { getCID } = require('../src/routes/files')

describe('test files', async function () {
  it('If content is not servable, return errorResponseForbidden', async function () {})
  it('If there is an error with checking file in storage, return errorResponseBadRequest', async function () {})
  it('If content is not servable, return errorResponseForbidden', async function () {})
  it('If the storage path is a directory, return errorResponseBadRequest', async function () {})
  it('If the storage path is not a file type, return errorResponseBadRequest', async function () {})
  it('If file is not found & is not found in db, return errorResponseNotFound', async function () {})
  it('If file is not found & is a dir type, return errorResponseBadRequest', async function () {})
  it('If the file is not found & is not in the network, return errorResponseServerError', async function () {})
  it('If the file is not found & is in the network & streaming fails, return errorResponseServerError', async function () {})
  it('If the file is not found & is in the network & streaming succeeds, return stream', async function () {})
})
