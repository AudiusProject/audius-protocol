import { useState, DragEvent } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'
import type {
  DecodedUserToken,
  AudiusSdk
} from '@audius/sdk/dist/sdk/index.d.ts'
import { useQueryClient } from '@tanstack/react-query'
import cn from 'classnames'

import { Page } from 'pages/Page'
import { useAudiusSdk } from 'providers/AudiusSdkProvider'

import styles from './Upload.module.css'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const validXmlFile = (file: File) => {
  if (file.type !== 'text/xml') {
    alert('Please upload a valid XML file.')
    return false
  }

  if (file.size > MAX_SIZE) {
    alert('File is too large.')
    return false
  }
  return true
}

const XmlImporter = ({
  audiusSdk,
  uploader
}: {
  audiusSdk: AudiusSdk | undefined | null
  uploader: DecodedUserToken | null
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSucceeded, setUploadSucceeded] = useState(false)
  const queryClient = useQueryClient()

  const handleDragIn = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragOut = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]) // reuse the file change handler
      e.dataTransfer.clearData()
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setUploadError(null)
    setUploadSucceeded(false)
  }

  const handleFileChange = (file: File) => {
    if (!validXmlFile(file)) {
      return
    }
    setSelectedFile(file)
    setUploadError(null)
    setUploadSucceeded(false)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first!')
      return
    }

    if (!validXmlFile(selectedFile)) {
      return
    }

    setUploadSucceeded(false)
    setIsUploading(true)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('uploadedBy', uploader?.userId || '')

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const result = await response.json()
      // eslint-disable-next-line no-console
      console.log(JSON.stringify(result))
      setUploadSucceeded(true)
      queryClient.invalidateQueries({ queryKey: ['uploads'] })
    } catch (error: any) {
      setUploadError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (!audiusSdk) {
    return <div className='text-red-500'>{'Error loading XML importer'}</div>
  } else {
    return (
      <Box borderRadius='s' shadow='near' p='xl' backgroundColor='white'>
        <Flex direction='column' gap='l'>
          <Text variant='heading' color='heading'>
            Upload a DDEX delivery
          </Text>
          <label
            className={cn(
              styles.fileDrop,
              { [styles.fileDropBorderDragging]: isDragging },
              { [styles.fileDropBorder]: !isDragging }
            )}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <span className={styles.fileDropTextContainer}>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                className={styles.fileDropIcon}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
                strokeWidth='2'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
                />
              </svg>
              <Text variant='body' color='default'>
                {'Drop files to upload, or '}
                <span className={styles.fileDropBrowseText}>browse</span>
              </Text>
            </span>
            <input
              type='file'
              name='file_upload'
              accept='text/xml,application/xml'
              className={styles.fileDropChooseFile}
              onChange={(e) => handleFileChange(e.target.files![0])}
            />
          </label>
          {selectedFile && (
            <>
              <Text variant='body' color='default'>
                Selected file:
              </Text>
              <Flex gap='s' alignItems='center'>
                <Button
                  variant='destructive'
                  size='small'
                  onClick={clearSelection}
                >
                  x
                </Button>
                <Text variant='body' color='default'>
                  {selectedFile.name}
                </Text>
              </Flex>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              {uploadError && (
                <Text variant='body' className={styles.errorText}>
                  {`Error uploading file: ${uploadError}`}
                </Text>
              )}
              {uploadSucceeded && (
                <Text variant='body' className={styles.successText}>
                  Upload success!
                </Text>
              )}
            </>
          )}
        </Flex>
      </Box>
    )
  }
}

const Upload = () => {
  const { audiusSdk, currentUser } = useAudiusSdk()

  return (
    <Page>
      <Flex gap='xl' direction='column'>
        <XmlImporter audiusSdk={audiusSdk} uploader={currentUser} />
      </Flex>
    </Page>
  )
}

export default Upload
