import { ComponentConfig, CustomField } from '@measured/puck'
import React, { useState } from 'react'

export type ImageProps = {
  url: string
  alt?: string
  caption?: string
}

const FileUploadField = ({
  name,
  id,
  value,
  onChange,
  readOnly,
}: {
  field: CustomField<string>
  name: string
  id: string
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}) => {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const fileName = value
    ? decodeURIComponent(value.split('/').pop() || '')
    : null

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Upload failed')

      const data = await response.json()
      const fileUrl = data.url

      onChange(fileUrl)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('File upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div>
      {!readOnly && (
        <>
          <div style={{ marginBottom: '10px' }}>
            <label
              htmlFor={id}
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                textAlign: 'center',
              }}
            >
              {fileName ? 'Change File' : 'Choose File'}
            </label>
            <input
              type="file"
              id={id}
              name={name}
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              ref={fileInputRef}
              style={{
                display: 'none', // Hide the default file input
              }}
            />
          </div>
          {fileName && (
            <div
              style={{
                fontSize: '14px',
                color: '#333',
                marginBottom: '10px',
              }}
            >
              {fileName}
            </div>
          )}
          {value && (
            <div>
              <button
                type="button"
                onClick={handleRemoveImage}
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  textAlign: 'center',
                  border: 'none',
                }}
              >
                Remove Image
              </button>
            </div>
          )}
        </>
      )}
      {uploading && <p>Uploading...</p>}
    </div>
  )
}

export const Image: ComponentConfig<ImageProps> = {
  label: 'Image',
  fields: {
    url: {
      type: 'custom',
      render: FileUploadField,
    },
    alt: {
      type: 'text',
      label: 'Alt Text',
    },
    caption: {
      type: 'textarea',
      label: 'Caption',
    },
  },
  render: ({ url, alt, caption }) => {
    const containerStyle = {
      width: '100%',
      height: '200px',
      backgroundColor: url ? 'transparent' : '#d3d3d3',
      display: 'flex',
      justifyContent: 'center',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '25px',
    }

    return (
      <figure>
        <div style={containerStyle}>
          {url ? (
            <img
              src={url}
              alt={alt || 'Image'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
          ) : (
            <span
              style={{ color: '#888', fontSize: '14px', alignSelf: 'center' }}
            >
              No Image
            </span>
          )}
        </div>
        {caption && (
          <figcaption style={{ marginBottom: '25px' }}>{caption}</figcaption>
        )}
      </figure>
    )
  },
}
