import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const createResource = (data) => API.post('/resources', data)
export const getResources = (params) => API.get('/resources', { params })
export const getResource = (id) => API.get(`/resources/${id}`)
export const updateResource = (id, data) => API.put(`/resources/${id}`, data)
export const deleteResource = (id) => API.delete(`/resources/${id}`)
export const uploadImage = (formData) => API.post('/resources/upload', formData)
export const processScreenshot = (data) => API.post('/resources/process-screenshot', data)
export const processReel = (data) => API.post('/resources/process-reel', data)
export const saveReelVideos = (data) => API.post('/resources/save-reel-videos', data)
export const autoTag = (data) => API.post('/resources/auto-tag', data)
export const getYoutubeDetails = (data) => API.post('/resources/youtube-details', data)
export const getTags = () => API.get('/resources/tags')