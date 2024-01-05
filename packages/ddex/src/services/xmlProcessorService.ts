/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Sql } from 'postgres'
import type { queueAsPromised } from 'fastq'
import type { AudiusSdk } from '@audius/sdk/dist/sdk/index.d.ts'
import type { XmlFileRow } from '../models/dbTypes'
import fastq from 'fastq'
import { getReleasesFromXml } from '../utils/xmlUtils'

/**
 * Processes XML files uploaded by manager/label/other.
 * In the future, this might include retries and re-processing files to apply new logic or bug fixes.
 */

export interface XmlProcessorService {
  addXmlFile: (
    fileBuffer: Buffer,
    uploadedBy?: string,
    zipFileUUID?: string
  ) => Promise<void>
}

export const createXmlProcessorService = (
  sql: Sql,
  audiusSdk: AudiusSdk
): XmlProcessorService => {
  const worker = async (row: XmlFileRow) => {
    console.log('Processing XML file with contents:', row.xml_contents)
    const releases = await getReleasesFromXml(row.xml_contents, audiusSdk)
    for (const release of releases) {
      console.log('Extracted release from XML:', release)
      await sql`INSERT INTO releases (from_xml_file, release_date, data, status) VALUES (
        ${row.id}, ${release.release_date}, ${JSON.stringify(
          release.data
        )}, 'pending')`
    }
    await sql`UPDATE xml_files SET status = 'success' WHERE id = ${row.id}`
    // TODO: Handle error state
  }

  const queue: queueAsPromised<XmlFileRow> = fastq.promise(worker, 1)

  const addXmlFile = async (
    fileBuffer: Buffer,
    uploadedBy: string | null = null,
    zipFileUUID: string | null = null
  ) => {
    const rows = await sql<
      XmlFileRow[]
    >`INSERT INTO xml_files (from_zip_file, xml_contents, uploaded_by, status) VALUES (${zipFileUUID}, ${fileBuffer.toString()}, ${uploadedBy}, 'processing') RETURNING *`
    console.log('Add XML file to queue:', JSON.stringify(rows[0]))
    queue.push(rows[0])
  }

  // TODO: Need to add all 'processing' to the queue on server start in case it restarted in the middle of processing

  // TODO: We'll also want a cron to scan for failed XML parsing and re-process them

  return {
    addXmlFile,
  }
}
