"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { setAuthenticated, setUser } = useStore()
  const router = useRouter()

  useEffect(() => {
    // Check for an existing session
    const initializeSession = async () => {
      try {
        console.log('Initializing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          return
        }
        
        if (session?.user) {
          console.log('Session found, user ID:', session.user.id)
          setAuthenticated(true)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
          })
        } else {
          console.log('No session found')
          setAuthenticated(false)
          setUser(null)
        }
      } catch (err) {
        console.error('Failed to initialize session:', err)
      }
    }
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        if (session?.user) {
          console.log('User authenticated:', session.user.id)
          setAuthenticated(true)
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
          })
        } else {
          console.log('User signed out')
          setAuthenticated(false)
          setUser(null)
          
          // Redirect to login page if not already there
          if (!window.location.pathname.includes('/auth/')) {
            router.push('/auth/login')
          }
        }
      }
    )
    
    // Initialize on mount
    initializeSession()
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [setAuthenticated, setUser, router])
  
  return <>{children}</>
}

