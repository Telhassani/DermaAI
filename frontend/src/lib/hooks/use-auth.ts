import { useState, useEffect } from 'react'

export interface User {
  id: number
  email: string
  full_name: string
  role: 'doctor' | 'admin' | 'staff'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user:', error)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // TODO: Implement actual login API call
      const mockUser: User = {
        id: 1,
        email,
        full_name: 'Dr. Utilisateur',
        role: 'doctor',
      }
      localStorage.setItem('user', JSON.stringify(mockUser))
      localStorage.setItem('access_token', 'mock-token')
      setUser(mockUser)
      return mockUser
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    setUser(null)
    window.location.href = '/login'
  }

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }
}
