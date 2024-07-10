import { createObjectCsvStringifier } from 'csv-writer';
import { ClientLabelMetadataHeader } from './queries/clm';

export const toCsvString = (rows: any[]): string => {
  const csvStringifier = createObjectCsvStringifier({
    header: ClientLabelMetadataHeader.map(key => ({ id: key, title: key }))
  })

  const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(rows)
  return csvString
}
