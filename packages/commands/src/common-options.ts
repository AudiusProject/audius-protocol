import { Option } from '@commander-js/extra-typings'

export const outputFormatOption = new Option(
  '-o, --output <format>',
  'The format to output'
)
  .choices(['default', 'json'] as const)
  .default('default' as const)
