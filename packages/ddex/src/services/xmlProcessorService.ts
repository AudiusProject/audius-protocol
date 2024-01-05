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
  addXmlFile: (fileBuffer: Buffer, zipFileUUID?: string) => Promise<void>
}

export const createXmlProcessorService = (
  sql: Sql,
  audiusSdk: AudiusSdk
): XmlProcessorService => {
  const worker = async (row: XmlFileRow) => {
    console.log('Processing XML file with contents:', row.xml_contents)
    const releases = await getReleasesFromXml(row.xml_contents, audiusSdk)
    for (const release of releases) {
      console.log('Extracting from XML:', release)
      await sql`INSERT INTO releases (from_xml_file, release_date, data, status) VALUES (
        ${row.id}, ${release.release_date}, ${JSON.stringify(
          release.data
        )}, 'pending')`
    }
    await sql`UPDATE xml_files SET status = 'success' WHERE id = ${row.id}`
    // TODO: Handle error state
  }

  const queue: queueAsPromised<XmlFileRow> = fastq.promise(worker, 1)

  const addXmlFile = async (fileBuffer: Buffer, zipFileUUID = '') => {
    await sql`INSERT INTO xml_files (from_zip_file, xml_contents, status) VALUES (${zipFileUUID}, ${fileBuffer.toString()}, 'pending')`
  }

  // Every 5 seconds, scan the db for pending XML files and enqueue them to be processed
  const enqueuePendingXml = async () => {
    try {
      const pending = await sql<
        XmlFileRow[]
      >`SELECT * FROM xml_files WHERE status = 'pending'`
      for (const row of pending) {
        // TODO: If we do this then if the server restarts it'll see everything as processing and not re-add it to the queue.
        // Need to add all 'processing' to the queue on server start in case it restarted in the middle of processing.
        await sql`UPDATE xml_files SET status = 'processing' WHERE id = ${row.id}`
        queue.push(row)
      }
    } catch (error) {
      console.error('Error processing XML files:', error)
    } finally {
      setTimeout(enqueuePendingXml, 5000)
    }
  }
  enqueuePendingXml()

  // TODO: We'll want a similar cron to scan for failed XML parsing and re-process them

  const processXmlFiles = async () => {
    // TODO: Another queue can scan the db for failed statuses and re-process them
  }

  return {
    addXmlFile,
  }
}
