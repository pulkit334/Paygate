import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '../services/auth.service'

export const useAuth = () => {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const session = await getSession()
        setAuthed(session.authenticated)
        if (!session.authenticated) {
          navigate('/login')
        }
      } catch {
        setAuthed(false)
        navigate('/login')
      }
    }

    checkSession()
  }, [navigate])

  return { authed: authed ?? false }
}
