import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextResponse } from 'next/server'

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: process.env.MINIO_REGION,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: true,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const bucketName = process.env.MINIO_BUCKET_NAME || 'uploads'
    const folderName = 'puck-uploads' // Organise uploads from Puck in a folder
    const fileName = `${Date.now()}-${file.name}`

    const fileKey = `${folderName}/${fileName}`

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(uploadCommand)

    const fileUrl = `${process.env.MINIO_ENDPOINT}/${bucketName}/${fileKey}`

    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error('MinIO Upload Error:', error)
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 })
  }
}
