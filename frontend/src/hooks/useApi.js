import { useAuth } from '../contexts/AuthContext'

const API_BASE = '/api'

export function useApi() {
  const { token } = useAuth()

  async function fetchWithAuth(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || 'Request failed')
    }

    if (res.status === 204 || options.method === 'DELETE') {
      return null
    }

    return res.json()
  }

  // Ideas
  async function getIdeas() {
    return fetchWithAuth('/ideas')
  }

  async function createIdea(data) {
    return fetchWithAuth('/ideas', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async function updateIdea(id, data) {
    return fetchWithAuth(`/ideas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async function deleteIdea(id) {
    return fetchWithAuth(`/ideas/${id}`, {
      method: 'DELETE'
    })
  }

  // Constellations
  async function getConstellations() {
    return fetchWithAuth('/constellations')
  }

  async function createConstellation(ideaId1, ideaId2) {
    return fetchWithAuth('/constellations', {
      method: 'POST',
      body: JSON.stringify({
        idea_id_1: ideaId1,
        idea_id_2: ideaId2
      })
    })
  }

  async function deleteConstellation(id) {
    return fetchWithAuth(`/constellations/${id}`, {
      method: 'DELETE'
    })
  }

  // Public profile
  async function getPublicProfile(userId) {
    const res = await fetch(`${API_BASE}/public/profile/${userId}`)
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Not found' }))
      throw new Error(error.detail || 'Profile not found')
    }
    return res.json()
  }

  // AI-powered related ideas
  async function getRelatedIdeas(ideaId) {
    return fetchWithAuth(`/ideas/${ideaId}/related`)
  }

  async function discoverIdeas() {
    return fetchWithAuth('/discover')
  }

  return {
    getIdeas,
    createIdea,
    updateIdea,
    deleteIdea,
    getConstellations,
    createConstellation,
    deleteConstellation,
    getPublicProfile,
    getRelatedIdeas,
    discoverIdeas
  }
}
