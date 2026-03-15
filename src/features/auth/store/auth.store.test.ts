import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@features/auth/store/auth.store'
import type { MeResponse } from '@shared/types/auth.types'

const MOCK_USER: MeResponse = {
  userId: '00000000-0000-0000-0000-000000000001',
  email: 'test@example.com',
  userName: 'Test User',
  profileId: '00000000-0000-0000-0000-000000000002',
}

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset to initial state before each test
    useAuthStore.setState({ user: null, isAuthenticated: false })
  })

  it('initialises with no authenticated user', () => {
    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('setUser sets the user and marks as authenticated', () => {
    useAuthStore.getState().setUser(MOCK_USER)

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toEqual(MOCK_USER)
    expect(isAuthenticated).toBe(true)
  })

  it('setUser(null) clears the user and marks as unauthenticated', () => {
    useAuthStore.getState().setUser(MOCK_USER)
    useAuthStore.getState().setUser(null)

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })

  it('clearAuth resets state to unauthenticated', () => {
    useAuthStore.getState().setUser(MOCK_USER)
    useAuthStore.getState().clearAuth()

    const { user, isAuthenticated } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(isAuthenticated).toBe(false)
  })
})
