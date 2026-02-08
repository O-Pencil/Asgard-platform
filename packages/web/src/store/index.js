import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Auth Store
export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setToken: (token) => {
        localStorage.setItem('asgard_token', token)
        set({ token, isAuthenticated: !!token })
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('asgard_token')
        set({ token: null, user: null, isAuthenticated: false })
      },

      init: () => {
        const token = localStorage.getItem('asgard_token')
        if (token) {
          set({ token, isAuthenticated: true })
        }
      },
    }),
    {
      name: 'asgard-auth',
    }
  )
)

// UI Store
export const useUIStore = create((set) => ({
  sidebarOpen: true,
  theme: 'light',

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}))

// Market Filter Store
export const useMarketStore = create((set, get) => ({
  searchQuery: '',
  category: 'all',
  capabilities: [],
  contextWindow: [],
  priceRange: [],
  sortBy: 'default',

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategory: (category) => set({ category }),
  toggleCapability: (cap) => {
    const caps = get().capabilities
    set({ capabilities: caps.includes(cap) ? caps.filter((c) => c !== cap) : [...caps, cap] })
  },
  setContextWindow: (windows) => set({ contextWindow: windows }),
  setPriceRange: (range) => set({ priceRange: range }),
  setSortBy: (sort) => set({ sortBy: sort }),

  resetFilters: () =>
    set({
      searchQuery: '',
      category: 'all',
      capabilities: [],
      contextWindow: [],
      priceRange: [],
      sortBy: 'default',
    }),
}))
