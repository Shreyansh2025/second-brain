import Tesseract from 'tesseract.js'

let worker = null

export const getWorker = async () => {
  if (!worker) {
    worker = await Tesseract.createWorker('eng')
  }
  return worker
}
