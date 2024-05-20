import { createObjectCsvStringifier } from 'csv-writer';

export const toCsvString = (rows: any[]): string => {
  if (rows.length === 0) {
    return ''
  }

  const keys = new Set<string>();
  rows.forEach(row => {
    Object.keys(row).forEach(key => keys.add(key))
  })

  const csvStringifier = createObjectCsvStringifier({
    header: Array.from(keys).map(key => ({ id: key, title: key })),
  })

  const csvString = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(rows)
  return csvString
}
