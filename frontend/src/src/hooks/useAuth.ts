import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const hasAuthCookie = () =>
  document.cookie.split('; ').some(c => c.startsWith('token='))

export const useAuth = () => {
  const navigate = useNavigate()
  const authed = hasAuthCookie()

  useEffect(() => {
    if (!authed) {
      navigate('/')
    }
  }, [authed, navigate])

  return { authed }
}
