import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const Register = () => {
  const navigate = useNavigate()
  useEffect(() => { navigate('/') }, [navigate])
  return null
}

export default Register
