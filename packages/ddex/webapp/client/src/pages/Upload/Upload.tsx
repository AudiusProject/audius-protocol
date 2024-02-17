import { useState, DragEvent } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'
import cn from 'classnames'

import { Collection } from 'components/Collection/Collection'
import { useAudiusSdk } from 'providers/AudiusSdkProvider'
import { useAuth } from 'providers/AuthProvider'
import { trpc } from 'utils/trpc'

import styles from './Upload.module.css'

const MAX_SIZE = 500 * 1024 * 1024 // 500 MB

const validZipFile = (file: File) => {
  if (
    file.type !== 'application/zip' &&
    file.type !== 'application/x-zip-compressed'
  ) {
    alert('Please upload a valid ZIP file.')
    return false
  }

  if (file.size > MAX_SIZE) {
    alert('File is too large.')
    return false
  }
  return true
}

const ZipImporter = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSucceeded, setUploadSucceeded] = useState(false)
  const { audiusSdk } = useAudiusSdk()
  const { user } = useAuth()
  const generateSignedUrl = trpc.upload.generateSignedUrl.useMutation()

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
    if (!validZipFile(file)) {
      return
    }
    setSelectedFile(file)
    setUploadError(null)
    setUploadSucceeded(false)
  }

  const uploadFileToS3 = async (signedUrl: string, file: File) => {
    const response = await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'application/zip'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to upload file: ${response.statusText}`)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first!')
      return
    }

    if (!validZipFile(selectedFile)) {
      return
    }

    setUploadSucceeded(false)
    setIsUploading(true)

    try {
      // Generate a signed URL for the file
      const fileName = selectedFile.name
      // TODO: This route should be authenticated
      // eslint-disable-next-line no-console
      console.log(
        `Generating signed URL for ${fileName} for user ${user?.userId}`
      )
      // TODO: Signed URL should authenticate the user
      const signedUrlResult = await generateSignedUrl.mutateAsync({ fileName })

      if (!signedUrlResult) {
        throw new Error('Failed to generate signed URL')
      }

      // Upload the file to S3
      await uploadFileToS3(signedUrlResult, selectedFile)
      setUploadSucceeded(true)
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsUploading(false)
    }
  }

  if (!audiusSdk) {
    return <div className='text-red-500'>{'Error loading ZIP importer'}</div>
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
              accept='application/zip,application/x-zip-compressed'
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
                  Your files have been uploaded to S3 and will be processed
                  soon.
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
  return (
    <Flex gap='xl' direction='column'>
      <ZipImporter />
      <Collection collection='uploads' />
    </Flex>
  )
}

export default Upload
