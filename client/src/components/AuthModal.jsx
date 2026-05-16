import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AuthModal() {
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError('')
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        if (!form.name) return setError('Name is required')
        await register(form.name, form.email, form.password)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl w-full max-w-sm mx-4 p-6 shadow-2xl">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 bg-[#7F77DD] rounded-lg flex items-center justify-center">
            <i className="ti ti-brain text-white text-sm" />
          </div>
          <span className="text-[#e0e0e0] font-medium">Second Brain</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111] rounded-lg p-1 mb-5">
          {['login', 'register'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={`flex-1 text-xs py-1.5 rounded-md transition-colors
                ${tab === t
                  ? 'bg-[#2a2a2a] text-[#e0e0e0]'
                  : 'text-[#555] hover:text-[#888]'
                }`}
            >
              {t === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex flex-col gap-3">
          {tab === 'register' && (
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7] transition-colors"
            />
          )}
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email address"
            className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7] transition-colors"
          />
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-xs text-[#ccc] placeholder-[#444] outline-none focus:border-[#534AB7] transition-colors"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-4 py-2.5 bg-[#7F77DD] hover:bg-[#6e66cc] disabled:opacity-50 rounded-lg text-xs text-white font-medium transition-colors"
        >
          {loading
            ? 'Please wait...'
            : tab === 'login' ? 'Sign in' : 'Create account'
          }
        </button>

        {/* Footer */}
        <p className="text-[10px] text-[#333] text-center mt-4">
          Your personal knowledge vault
        </p>

      </div>
    </div>
  )
}