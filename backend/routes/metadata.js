import sharp from 'sharp'
import { ExifTool } from 'exiftool-vendored'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const metadataHandler = async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded')
  }

  const tempInputPath = join(
    tmpdir(),
    `input-${Date.now()}-${req.file.originalname}`
  )

  try {
    // Write buffer to temporary file
    await fs.writeFile(tempInputPath, req.file.buffer)

    // Initialize ExifTool for detailed metadata reading
    const exiftool = new ExifTool()

    // Get sensitive metadata before cleaning
    const originalTags = await exiftool.read(tempInputPath)
    const sensitiveTags = {
      GPS: {
        Latitude: originalTags.GPSLatitude?.toString() || 'Not found',
        Longitude: originalTags.GPSLongitude?.toString() || 'Not found',
      },
      Camera: {
        Make: originalTags.Make || 'Not found',
        Model: originalTags.Model || 'Not found',
        SerialNumber: originalTags.SerialNumber || 'Not found',
      },
      DateTime: originalTags.CreateDate?.toString() || 'Not found',
      Software: originalTags.Software || 'Not found',
    }

    // Process image
    const cleanedBuffer = await sharp(req.file.buffer)
      .rotate()
      .jpeg({ quality: 92 })
      .toBuffer()

    // Close ExifTool and clean up
    await exiftool.end()
    await fs.unlink(tempInputPath)

    // Send response
    res.send({
      metadata: {
        original: sensitiveTags,
        fileSize: {
          original: `${(req.file.buffer.length / (1024 * 1024)).toFixed(2)} MB`,
          cleaned: `${(cleanedBuffer.length / (1024 * 1024)).toFixed(2)} MB`,
        },
      },
      image: Array.from(cleanedBuffer), // Convert Buffer to Array for frontend
    })
  } catch (error) {
    console.error('Error processing image:', error)
    try {
      await fs.unlink(tempInputPath)
    } catch (cleanupError) {
      console.error('Error cleaning up:', cleanupError)
    }
    res.status(500).send('Error processing image')
  }
}

export default metadataHandler
