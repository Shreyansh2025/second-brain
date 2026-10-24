import { useEffect, useState } from 'react'
import axios from 'axios'
import { AuthContext } from './auth-context.js'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem('token'))
  )

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) return

    let active = true

    API.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (active) {
          setUser(res.data.data)
        }
      })
      .catch(() => {
        if (active) {
          localStorage.removeItem('token')
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password })
    const { token, ...userData } = res.data.data

    localStorage.setItem('token', token)
    setUser(userData)

    return userData
  }

  const register = async (name, email, password) => {
    const res = await API.post('/auth/register', {
      name,
      email,
      password,
    })

    const { token, ...userData } = res.data.data

    localStorage.setItem('token', token)
    setUser(userData)

    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}