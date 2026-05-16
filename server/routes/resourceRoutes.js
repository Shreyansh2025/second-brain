import express from 'express'
import rateLimit from 'express-rate-limit'
import {
    createResource,
    getResources,
    getResource,
    updateResource,
    deleteResource,
    uploadImage,
    extractText,
    searchYoutube,
    processScreenshot,
    processReel,
    saveReelVideos,
    autoTag,
    getTags,
    getYoutubeDetails,
    getDailyDigest,
} from '../controllers/resourceController.js'
import { upload } from '../config/cloudinary.js'
import { protect } from '../middleware/auth.js'

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests, slow down.' },
})

const router = express.Router()
router.use(protect)

router.route('/').get(getResources).post(createResource)
router.post('/upload', upload.single('image'), uploadImage)
router.get('/tags', getTags)
router.post('/extract-text', aiLimiter, extractText)
router.post('/search-youtube', aiLimiter, searchYoutube)
router.post('/process-screenshot', aiLimiter, processScreenshot)
router.post('/youtube-details', aiLimiter, getYoutubeDetails)
router.post('/process-reel', aiLimiter, processReel)
router.post('/save-reel-videos', saveReelVideos)
router.post('/auto-tag', aiLimiter, autoTag)
router.post('/digest', getDailyDigest)
router.route('/:id').get(getResource).put(updateResource).delete(deleteResource)

export default router
