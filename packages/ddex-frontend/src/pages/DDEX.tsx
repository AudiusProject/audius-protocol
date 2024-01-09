import { useState, DragEvent } from 'react'
import { useAudiusSdk } from '../providers/AudiusSdkProvider'
import type { DecodedUserToken } from '@audius/sdk/dist/sdk/index.d.ts'
import type { AudiusSdk } from '@audius/sdk/dist/sdk/index.d.ts'

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
  onChangeUser,
  oauthError,
}: {
  currentUser: DecodedUserToken
  onChangeUser: () => void
  oauthError: string | null
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>{`Logged in as @${currentUser.handle}`}</div>
      <button className="btn btn-blue" onClick={onChangeUser}>
        Switch users
      </button>
      {oauthError && <div className="text-red-600">{oauthError}</div>}
    </div>
  )
}

const XmlImporter = ({
  audiusSdk,
}: {
  audiusSdk: AudiusSdk | undefined | null
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSucceeded, setUploadSucceeded] = useState(false)

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

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`)
      }

      const result = await response.json()
      console.log(JSON.stringify(result))
      setUploadSucceeded(true)
    } catch (error: any) {
      setUploadError(error.message)
    } finally {
      setIsUploading(false)
    }
  }

  if (!audiusSdk) {
    return <div className="text-red-500">{'Error loading XML importer'}</div>
  } else {
    return (
      <>
        <label
          className={`flex justify-center h-32 px-4 transition bg-white border-2 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none ${
            isDragging ? 'border-gray-400' : 'border-gray-300 '
          }`}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="flex items-center space-x-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="font-medium text-gray-600">
              {'Drop files to upload, or '}
              <span className="text-blue-600 underline">browse</span>
            </span>
          </span>
          <input
            type="file"
            name="file_upload"
            accept="text/xml,application/xml"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files![0])}
          />
        </label>
        {selectedFile && (
          <>
            <div>Selected file:</div>
            <div className="flex space-x-4">
              <div>{selectedFile.name}</div>
              <button
                className="text-xs w-8 p-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none"
                onClick={clearSelection}
              >
                x
              </button>
            </div>
            <button
              className="btn btn-blue"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
            {uploadError && (
              <div className="text-red-500">
                {`Error uploading file: ${uploadError}`}
              </div>
            )}
            {uploadSucceeded && (
              <div className="text-green-500">Upload success!</div>
            )}
          </>
        )}
      </>
    )
  }
}

export const Ddex = () => {
  const { audiusSdk, currentUser, oauthError } = useAudiusSdk()

  const handleOauth = () => {
    audiusSdk!.oauth!.login({ scope: 'read' })
  }

  return (
    <div className="flex flex-col space-y-4">
      {!audiusSdk ? (
        'loading...'
      ) : !currentUser ? (
        <div className="flex flex-col space-y-4 justify-center items-center h-screen">
          <button className="btn btn-blue" onClick={handleOauth}>
            Login with Audius
          </button>
          {oauthError && <div className="text-red-600">{oauthError}</div>}
        </div>
      ) : (
        <>
          <ManageAudiusAccount
            currentUser={currentUser}
            onChangeUser={handleOauth}
            oauthError={oauthError}
          />
          <XmlImporter audiusSdk={audiusSdk} />
        </>
      )}
    </div>
  )
}
