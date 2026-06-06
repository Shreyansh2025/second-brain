import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export function useSocket(onResourceAdded, onResourceDeleted) {
  const { user } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) return

    console.log('Connecting socket...')

    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
      { withCredentials: true }
    )

    const socket = socketRef.current

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
      socket.emit('join', user._id)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    socket.on('resource:added', (resource) => {
      console.log('Resource received:', resource.title)
      onResourceAdded?.(resource)
    })

    socket.on('resource:deleted', ({ id }) => {
      onResourceDeleted?.(id)
    })

    return () => {
      socket.disconnect()
    }
  }, [user])
}