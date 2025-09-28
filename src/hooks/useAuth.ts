import { useStore } from "../store/useStore"
import { supabase } from "@/lib/supabase"

export const useAuth = () => {
  const { setAuthenticated, setUser, setAuthToken, clearAuth, loadScenarios } = useStore()

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    if (data.user && data.session) {
      setAuthToken(data.session.access_token)
      setAuthenticated(true)
      setUser({
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata.name || data.user.email!,
      })
      // Load scenarios after successful login
      await loadScenarios()
      return { success: true }
    }
    
    return { success: false, error: "Login failed unexpectedly." }
  }

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // The user is created, but they need to confirm their email.
    // Supabase handles this, but our UI state should reflect that they are pending.
    // For now, we'll treat it as a successful signup immediately.
    if (data.user && data.session) {
        setAuthToken(data.session.access_token)
        setAuthenticated(true)
        setUser({
            id: data.user.id,
            email: data.user.email!,
            name: data.user.user_metadata.name || data.user.email!,
        })
        // Load scenarios after successful signup
        await loadScenarios()
        return { success: true }
    }

    return { success: false, error: "Signup failed unexpectedly." }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    clearAuth()
  }

  return {
    login,
    signup,
    logout,
  }
}
