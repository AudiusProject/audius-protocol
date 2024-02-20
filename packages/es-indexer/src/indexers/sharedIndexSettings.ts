import {
  IndicesIndexSettings,
  MappingProperty,
} from '@elastic/elasticsearch/lib/api/types'

export const sharedIndexSettings: IndicesIndexSettings = {
  analysis: {
    char_filter: {
      whitespace_remove: {
        type: 'pattern_replace',
        pattern: ' ',
        replacement: '',
        flags: '',
      },
    },
    normalizer: {
      lower_asciifolding: {
        type: 'custom',
        filter: ['asciifolding', 'lowercase'],
      },
      lower_asciifolding_no_whitespace: {
        type: 'custom',
        char_filter: ['whitespace_remove'],
        filter: ['asciifolding', 'lowercase'],
      },
    },
    analyzer: {
      standard_asciifolding: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['asciifolding', 'lowercase'],
      },
      lower_keyword: {
        type: 'custom',
        tokenizer: 'keyword',
        filter: ['lowercase'],
      },
    },
  },

  index: {
    number_of_shards: 1,
    number_of_replicas: 0,
    refresh_interval: '5s',
    // get_feed_es uses terms lookup to get reposts by followers
    // default limit is 65536, but there are users that follow >65k people.
    // so set to a million
    max_terms_count: 1000000,
  },
}

export const standardSuggest: MappingProperty = {
  type: 'search_as_you_type',
  analyzer: 'standard_asciifolding',
}

export const standardText: MappingProperty = {
  type: 'text',
  analyzer: 'standard_asciifolding',
}

export const lowerKeyword: MappingProperty = {
  type: 'keyword',
  normalizer: 'lower_asciifolding',
}

export const lowerKeywordTermVector: MappingProperty = {
  type: 'text',
  analyzer: 'lower_keyword',
  term_vector: 'yes',
}

export const noWhitespaceLowerKeyword: MappingProperty = {
  type: 'keyword',
  normalizer: 'lower_asciifolding_no_whitespace',
}
