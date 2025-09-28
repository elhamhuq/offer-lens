import { useStore } from "../store/useStore"
import { scenariosDb } from "../lib/database"
import type { Scenario, JobOffer, Investment } from "../types"

export const useScenario = () => {
  const { 
    scenarios, 
    currentScenario, 
    addScenario, 
    setCurrentScenario, 
    updateScenario, 
    deleteScenario,
    user,
    isAuthenticated 
  } = useStore()

  const createScenario = async (name: string, jobOffer: JobOffer, investments: Investment[]): Promise<Scenario | null> => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated')
      return null
    }

    try {
      // Create scenario in Supabase
      const dbScenario = await scenariosDb.create({
        user_id: user.id,
        name,
        job_offer: jobOffer,
        investments: investments,
      })

      if (!dbScenario) {
        console.error('Failed to create scenario in database')
        return null
      }

      // Convert database scenario to local format
      const newScenario: Scenario = {
        id: dbScenario.id,
        name: dbScenario.name,
        jobOffer: dbScenario.job_offer,
        investments: dbScenario.investments,
        createdAt: new Date(dbScenario.created_at),
        updatedAt: new Date(dbScenario.updated_at),
      }

      // Add to local store
      addScenario(newScenario)
      setCurrentScenario(newScenario)
      
      return newScenario
    } catch (error) {
      console.error('Error creating scenario:', error)
      return null
    }
  }

  const updateCurrentScenario = async (updates: Partial<Scenario>) => {
    if (!currentScenario || !isAuthenticated || !user) {
      console.error('No current scenario or user not authenticated')
      return
    }

    try {
      // Update in Supabase
      const dbScenario = await scenariosDb.update(currentScenario.id, {
        name: updates.name,
        job_offer: updates.jobOffer,
        investments: updates.investments,
      })

      if (dbScenario) {
        // Update local store
        updateScenario(currentScenario.id, { 
          ...updates, 
          updatedAt: new Date(dbScenario.updated_at) 
        })
      }
    } catch (error) {
      console.error('Error updating scenario:', error)
    }
  }

  const deleteScenarioFromDb = async (id: string) => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated')
      return false
    }

    try {
      const success = await scenariosDb.delete(id)
      if (success) {
        deleteScenario(id)
      }
      return success
    } catch (error) {
      console.error('Error deleting scenario:', error)
      return false
    }
  }

  return {
    scenarios,
    currentScenario,
    createScenario,
    setCurrentScenario,
    updateCurrentScenario,
    deleteScenario: deleteScenarioFromDb,
  }
}
