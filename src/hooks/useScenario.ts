import { useStore } from "../store/useStore"
import type { Scenario, JobOffer, Investment } from "../types"

export const useScenario = () => {
  const { scenarios, currentScenario, addScenario, setCurrentScenario, updateScenario, deleteScenario } = useStore()

  const createScenario = (name: string, jobOffer: JobOffer, investments: Investment[]) => {
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name,
      jobOffer,
      investments,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    addScenario(newScenario)
    setCurrentScenario(newScenario)
    return newScenario
  }

  const updateCurrentScenario = (updates: Partial<Scenario>) => {
    if (currentScenario) {
      updateScenario(currentScenario.id, { ...updates, updatedAt: new Date() })
    }
  }

  return {
    scenarios,
    currentScenario,
    createScenario,
    setCurrentScenario,
    updateCurrentScenario,
    deleteScenario,
  }
}
