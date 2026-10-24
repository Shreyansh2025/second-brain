import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './useAuth'

export function useSocket(onResourceAdded, onResourceDeleted) {
  const { user } = useAuth()
  const socketRef = useRef(null)

  const callbacksRef = useRef({
    onResourceAdded,
    onResourceDeleted,
  })

  useEffect(() => {
    callbacksRef.current = {
      onResourceAdded,
      onResourceDeleted,
    }
  }, [onResourceAdded, onResourceDeleted])

  useEffect(() => {
    if (!user) return

    const token = localStorage.getItem('token')

    if (!token) return

    console.log('Connecting socket...')

    const socket = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') ||
        'http://localhost:5000',
      {
        withCredentials: true,
        auth: { token },
      }
    )

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.error('Socket error:', err.message)
    })

    socket.on('resource:added', (resource) => {
      console.log('Resource received:', resource.title)
      callbacksRef.current.onResourceAdded?.(resource)
    })

    socket.on('resource:deleted', ({ id }) => {
      callbacksRef.current.onResourceDeleted?.(id)
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])
}