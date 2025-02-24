import React, { useState } from 'react'

function App() {
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [metadata, setMetadata] = useState(null)

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0])
    } else {
      setFile(null)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append('photo', file)

    setMessage('')
    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setMetadata(data.metadata)

        // Create and download the cleaned image
        const imageBuffer = new Uint8Array(data.image)
        const blob = new Blob([imageBuffer], { type: file.type })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'cleaned_' + file.name
        a.click()
        window.URL.revokeObjectURL(url)

        setMessage('Image processed successfully!')
      } else {
        setMessage('Error processing image')
      }
    } catch (error) {
      console.error('Error:', error)
      setMessage('Error processing image')
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Photo Metadata Cleaner</h1>
      <form onSubmit={handleSubmit} className="mb-4">
        <input
          type="file"
          onChange={handleFileChange}
          className="mb-2"
          accept="image/*"
        />
        <button
          type="submit"
          disabled={!file}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Clean and Download
        </button>
      </form>

      {metadata && (
        <div className="mt-4">
          <h2 className="text-xl mb-2">
            Sensitive Metadata Found and Removed:
          </h2>
          <div className="bg-gray-100 p-4 rounded">
            <div className="mb-2">
              <strong>GPS Location:</strong> {metadata.original.GPS.Latitude},{' '}
              {metadata.original.GPS.Longitude}
            </div>
            <div className="mb-2">
              <strong>Camera:</strong> {metadata.original.Camera.Make}{' '}
              {metadata.original.Camera.Model}
              {metadata.original.Camera.SerialNumber !== 'Not found' &&
                ` (SN: ${metadata.original.Camera.SerialNumber})`}
            </div>
            <div className="mb-2">
              <strong>Creation Date:</strong> {metadata.original.DateTime}
            </div>
            {metadata.original.Software !== 'Not found' && (
              <div className="mb-2">
                <strong>Software:</strong> {metadata.original.Software}
              </div>
            )}
            <div className="mt-4">
              <strong>File Size:</strong>
              <div>Original: {metadata.fileSize.original}</div>
              <div>Cleaned: {metadata.fileSize.cleaned}</div>
            </div>
          </div>
        </div>
      )}

      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}

export default App
