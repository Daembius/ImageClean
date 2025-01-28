const express = require('express')
const multer = require('multer')
const path = require('path')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000
const fs = require('fs')
require('dotenv').config()
const sharp = require('sharp')

const uploadDir = process.env.UPLOAD_DIR || 'uploads'
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname)
    )
  },
})

const upload = multer({ storage: storage })

// MIDDLEWARE
app.use(cors())

app.post('/upload', upload.single('photo'), async (req, res) => {
  const newFilePath = req.file.path + '_tmp'
  try {
    console.log('Starting metadata removal for', req.file.path)
    const metadataBefore = await sharp(req.file.path).metadata()
    console.log('Metadata before:', metadataBefore)

    // Remove all EXIF data and write to a new file
    await sharp(req.file.path)
      .withMetadata() // This removes all EXIF metadata
      .toFile(newFilePath) // Write to a temporary file

    // Remove original file and rename new one
    fs.unlinkSync(req.file.path)
    fs.renameSync(newFilePath, req.file.path)

    const metadataAfter = await sharp(req.file.path).metadata()
    console.log('Metadata after:', metadataAfter)

    res.download(req.file.path, () => {
      // Remove the file after sending it
      fs.unlinkSync(req.file.path)
    })
  } catch (error) {
    console.error('Error processing image:', error)
    // Clean up if an error occurs
    if (fs.existsSync(newFilePath)) {
      fs.unlinkSync(newFilePath)
    }
    res.status(500).send('Error processing image')
  }
})

app.listen(port, () => console.log(`Server running on port ${port}`))
