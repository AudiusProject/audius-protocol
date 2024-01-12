import { useState, DragEvent } from 'react'

import { Text, Button, Box, Flex } from '@audius/harmony'
import type {
  DecodedUserToken,
  AudiusSdk
} from '@audius/sdk/dist/sdk/index.d.ts'
import { useQueryClient } from '@tanstack/react-query'
import cn from 'classnames'

import Releases from 'components/admin/Releases'
import Uploads from 'components/admin/Uploads'
import { useAudiusSdk } from 'providers/AudiusSdkProvider'

import styles from './DDEX.module.css'

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

const ManageAudiusAccount = ({
  currentUser,
  isAdmin,
  onChangeUser,
  oauthError
}: {
  currentUser: DecodedUserToken
  isAdmin: boolean
  onChangeUser: () => void
  oauthError: string | null
}) => {
  return (
    <Flex justifyContent='space-between' alignItems='center'>
      <Flex gap='m' alignItems='center'>
        <Text
          variant='body'
          color='default'
        >{`Logged in as @${currentUser.handle}`}</Text>
        {isAdmin && (
          <Text variant='label' color='subdued' className={styles.adminBadge}>
            ADMIN
          </Text>
        )}
      </Flex>
      <Button variant='secondary' onClick={onChangeUser}>
        Switch users
      </Button>
      {oauthError && <div className='text-red-600'>{oauthError}</div>}
    </Flex>
  )
}

const XmlImporter = ({
  audiusSdk,
  uploader
}: {
  audiusSdk: AudiusSdk | undefined | null,
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

    // TODO more extensive sanitation + schema validation

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

const Ddex = () => {
  const { audiusSdk, currentUser, isAdmin, oauthError } = useAudiusSdk()

  const handleOauth = () => {
    audiusSdk!.oauth!.login({ scope: 'read' })
  }

  // Use this if you want to skip the oauth flow but still show the UI for a user
  // const fakeUser = {
  //   userId: '1',
  //   email: '1',
  //   name: 'theo',
  //   handle: 'theo',
  //   verified: false,
  //   profilePicture: undefined,
  //   sub: '1',
  //   iat: '',
  // }

  return (
    <Box>
      <Flex gap='xs' direction='column'>
        {!audiusSdk ? (
          'loading...'
        ) : !currentUser ? (
          <Flex
            p='xl'
            gap='m'
            direction='column'
            justifyContent='center'
            alignItems='center'
          >
            <Button onClick={handleOauth}>Login with Audius</Button>
            {oauthError && <div className={styles.errorText}>{oauthError}</div>}
          </Flex>
        ) : (
          <Flex direction='column'>
            <Box p='xl'>
              <ManageAudiusAccount
                currentUser={currentUser}
                isAdmin={isAdmin}
                onChangeUser={handleOauth}
                oauthError={oauthError}
              />
            </Box>
            <Box
              p='xl'
              backgroundColor='surface2'
              borderTop='strong'
              className={styles.page}
            >
              <Flex gap='xl' direction='column'>
                <XmlImporter audiusSdk={audiusSdk}  uploader={currentUser} />
                {/* <ManageAudiusAccount
                  currentUser={currentUser || fakeUser}
                  isAdmin={true}
                  onChangeUser={handleOauth}
                  oauthError={oauthError}
                />
                <XmlImporter audiusSdk={audiusSdk}  uploader={fakeUser} /> */}

                {isAdmin && (
                  <>
                    <Flex direction='column' gap='s'>
                      <Uploads />
                    </Flex>
                    <Flex direction='column' gap='s'>
                      <Releases />
                    </Flex>
                  </>
                )}
              </Flex>
            </Box>
          </Flex>
        )}
      </Flex>
    </Box>
  )
}

export default Ddex
