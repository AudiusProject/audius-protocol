import fs from 'fs'

export const convertToCSV = (data: any) => {
  const headers = Object.keys(data[0])
  const rows = data.map((row: any) =>
    headers.map(header => JSON.stringify(row[header] || '')).join(',')
  )
  return [headers.join(','), ...rows].join('\n')
}

export const writeCSVToFile = (data: any, filename: string) => {
  fs.writeFileSync(filename, data)
}
