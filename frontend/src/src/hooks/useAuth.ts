import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const useAuth = () => {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!token) {
      navigate('/login')
    }
  }, [token, navigate])

  return { token }
}
