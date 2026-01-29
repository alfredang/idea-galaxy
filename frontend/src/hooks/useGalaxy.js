import { useState, useCallback, useEffect } from 'react'
import { useApi } from './useApi'
import { toast } from 'sonner'

export function useGalaxy() {
  const api = useApi()
  const [ideas, setIdeas] = useState([])
  const [constellations, setConstellations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIdea, setSelectedIdea] = useState(null)
  const [linkMode, setLinkMode] = useState(false)
  const [linkSource, setLinkSource] = useState(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [ideasData, constellationsData] = await Promise.all([
        api.getIdeas(),
        api.getConstellations()
      ])
      setIdeas(ideasData)
      setConstellations(constellationsData)
    } catch (err) {
      toast.error('Failed to load galaxy data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addIdea = useCallback(async (data) => {
    try {
      // Generate position that avoids existing stars
      const position = generateSafePosition(ideas)
      const newIdea = await api.createIdea({ ...data, position })
      setIdeas(prev => [...prev, newIdea])
      toast.success('New star born in your galaxy')
      return newIdea
    } catch (err) {
      toast.error(err.message || 'Failed to create idea')
      throw err
    }
  }, [ideas])

  const updateIdea = useCallback(async (id, data) => {
    try {
      const updated = await api.updateIdea(id, data)
      setIdeas(prev => prev.map(idea => idea.id === id ? updated : idea))
      toast.success('Star updated')
      return updated
    } catch (err) {
      toast.error(err.message || 'Failed to update idea')
      throw err
    }
  }, [])

  const removeIdea = useCallback(async (id) => {
    try {
      await api.deleteIdea(id)
      setIdeas(prev => prev.filter(idea => idea.id !== id))
      setConstellations(prev => prev.filter(c => c.idea_id_1 !== id && c.idea_id_2 !== id))
      toast.success('Star faded from your galaxy')
    } catch (err) {
      toast.error(err.message || 'Failed to delete idea')
      throw err
    }
  }, [])

  const updateIdeaPosition = useCallback(async (id, position) => {
    try {
      const updated = await api.updateIdea(id, { position })
      setIdeas(prev => prev.map(idea => idea.id === id ? updated : idea))
    } catch (err) {
      console.error('Failed to update position:', err)
    }
  }, [])

  const linkIdeas = useCallback(async (id1, id2) => {
    try {
      const constellation = await api.createConstellation(id1, id2)
      setConstellations(prev => [...prev, constellation])
      toast.success('Constellation formed')
      return constellation
    } catch (err) {
      toast.error(err.message || 'Failed to link ideas')
      throw err
    }
  }, [])

  const unlinkIdeas = useCallback(async (constellationId) => {
    try {
      await api.deleteConstellation(constellationId)
      setConstellations(prev => prev.filter(c => c.id !== constellationId))
      toast.success('Constellation dissolved')
    } catch (err) {
      toast.error(err.message || 'Failed to unlink ideas')
      throw err
    }
  }, [])

  const handleStarClick = useCallback((idea) => {
    if (linkMode) {
      if (!linkSource) {
        setLinkSource(idea)
        toast.info('Select another star to form a constellation')
      } else if (linkSource.id !== idea.id) {
        // Check if constellation already exists
        const exists = constellations.some(c =>
          (c.idea_id_1 === linkSource.id && c.idea_id_2 === idea.id) ||
          (c.idea_id_1 === idea.id && c.idea_id_2 === linkSource.id)
        )
        if (exists) {
          toast.error('These stars are already connected')
        } else {
          linkIdeas(linkSource.id, idea.id)
        }
        setLinkSource(null)
        setLinkMode(false)
      }
    } else {
      setSelectedIdea(idea)
    }
  }, [linkMode, linkSource, constellations, linkIdeas])

  const toggleLinkMode = useCallback(() => {
    setLinkMode(prev => !prev)
    setLinkSource(null)
    if (!linkMode) {
      toast.info('Link mode activated - click two stars to connect them')
    }
  }, [linkMode])

  return {
    ideas,
    constellations,
    loading,
    selectedIdea,
    setSelectedIdea,
    linkMode,
    linkSource,
    toggleLinkMode,
    addIdea,
    updateIdea,
    removeIdea,
    updateIdeaPosition,
    linkIdeas,
    unlinkIdeas,
    handleStarClick,
    refresh: loadData
  }
}

// Generate a position that maintains minimum distance from existing stars
function generateSafePosition(existingIdeas, minDistance = 0.1) {
  const maxAttempts = 50

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const position = {
      x: 0.15 + Math.random() * 0.7, // Keep within 15%-85% of canvas
      y: 0.15 + Math.random() * 0.7
    }

    const isSafe = existingIdeas.every(idea => {
      const dx = position.x - idea.position.x
      const dy = position.y - idea.position.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      return distance >= minDistance
    })

    if (isSafe || existingIdeas.length === 0) {
      return position
    }
  }

  // Fallback: return random position if can't find safe spot
  return {
    x: 0.15 + Math.random() * 0.7,
    y: 0.15 + Math.random() * 0.7
  }
}
