import { rm } from 'fs/promises'

// s3 cache is now in /tmp/ddex_cache
// this will nuke that whole folder
// in future should make it delete items older than 7 days or something
// to make retries cheaper
export async function cleanupFiles() {
  return rm('/tmp/ddex_cache', { recursive: true })
}
