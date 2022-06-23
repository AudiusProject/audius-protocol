import {
  IndicesIndexSettings,
  MappingProperty,
} from '@elastic/elasticsearch/lib/api/types'

export const sharedIndexSettings: IndicesIndexSettings = {
  analysis: {
    normalizer: {
      lower_asciifolding: {
        type: 'custom',
        filter: ['asciifolding', 'lowercase'],
      },
    },
    analyzer: {
      standard_asciifolding: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['asciifolding', 'lowercase'],
      },
    },
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
