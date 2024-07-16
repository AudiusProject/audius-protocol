import { createObjectCsvStringifier } from 'csv-writer';

export const toCsvString = (rows: any[], header: string[]): string => {
  const csvStringifier = createObjectCsvStringifier({
    header: header.map(key => ({ id: key, title: key }))
  })

  const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(rows)
  return csvString
}
