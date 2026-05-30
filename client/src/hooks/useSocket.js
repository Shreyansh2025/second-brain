import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'

export function useSocket(onResourceAdded, onResourceDeleted) {
  const { user } = useAuth()
  const socketRef = useRef(null)

  useEffect(() => {
    if (!user) return
    socketRef.current = io(
      import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000',
      { withCredentials: true }
    )
    const socket = socketRef.current
    socket.emit('join', user._id)
    socket.on('resource:added', (resource) => {
      onResourceAdded?.(resource)
    })
    socket.on('resource:deleted', ({ id }) => {
      onResourceDeleted?.(id)
    })
    return () => {
      socket.disconnect()
    }
  }, [user])
  // NO return here
}