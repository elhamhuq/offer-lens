import { useStore } from "../store/useStore"

export const useAuth = () => {
  const { isAuthenticated, user, setAuthenticated, setUser } = useStore()

  const login = async (email: string, password: string) => {
    // Mock login - replace with real authentication
    if (email && password) {
      setAuthenticated(true)
      setUser({
        id: "1",
        email,
        name: email.split("@")[0],
      })
      return { success: true }
    }
    return { success: false, error: "Invalid credentials" }
  }

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup - replace with real authentication
    if (email && password && name) {
      setAuthenticated(true)
      setUser({
        id: "1",
        email,
        name,
      })
      return { success: true }
    }
    return { success: false, error: "Invalid data" }
  }

  const logout = () => {
    setAuthenticated(false)
    setUser(null)
  }

  return {
    isAuthenticated,
    user,
    login,
    signup,
    logout,
  }
}
