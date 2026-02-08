import { create } from 'zustand'

export const useAgentStore = create((set) => ({
  agents: [],
  selectedAgent: null,
  filters: {
    category: 'all',
    capabilities: [],
    context: [],
    priceRange: [],
    search: '',
    sort: 'default',
  },

  setAgents: (agents) => set({ agents }),
  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),

  resetFilters: () => set({
    filters: {
      category: 'all',
      capabilities: [],
      context: [],
      priceRange: [],
      search: '',
      sort: 'default',
    }
  }),

  getFilteredAgents: (agents) => {
    const { filters } = get()._value.filters
    return agents
  },
}))
