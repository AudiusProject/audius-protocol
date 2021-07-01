import { NativeMobileMessage } from './helpers'
import { MessageType } from './types'

export class OpenSearchMessage extends NativeMobileMessage {
  constructor({ reset }: { reset: boolean } = { reset: true }) {
    super(MessageType.OPEN_SEARCH, { reset })
  }
}

export class SubmitSearchQueryMessage extends NativeMobileMessage {
  constructor() {
    super(MessageType.SUBMIT_SEARCH_QUERY)
  }
}

export class FetchSearchSuccessMessage extends NativeMobileMessage {
  constructor({ query, results }: { query: string; results: any }) {
    super(MessageType.FETCH_SEARCH_SUCCESS, { query, results })
  }
}

export class FetchSearchFailureMessage extends NativeMobileMessage {
  constructor({ query }: { query?: string } = {}) {
    super(MessageType.FETCH_SEARCH_FAILURE, { query })
  }
}
