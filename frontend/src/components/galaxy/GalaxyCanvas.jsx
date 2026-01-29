import { useRef, useEffect, useState, useCallback } from 'react'

const STATUS_COLORS = {
  spark: { r: 255, g: 255, b: 255 },
  developing: { r: 255, g: 215, b: 0 },
  refined: { r: 255, g: 107, b: 0 },
  completed: { r: 0, g: 229, b: 255 },
  archived: { r: 128, g: 128, b: 128 }
}

const STATUS_SIZES = {
  spark: 12,
  developing: 16,
  refined: 20,
  completed: 24,
  archived: 10
}

export default function GalaxyCanvas({
  ideas = [],
  constellations = [],
  onStarClick,
  onStarDragEnd,
  onStarHover,
  linkMode = false,
  linkSource = null,
  readOnly = false
}) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [hoveredStar, setHoveredStar] = useState(null)
  const [draggingStar, setDraggingStar] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const backgroundStarsRef = useRef([])
  const ideasRef = useRef(ideas)

  // Keep ideas ref updated
  useEffect(() => {
    ideasRef.current = ideas
  }, [ideas])

  // Initialize background stars
  useEffect(() => {
    backgroundStarsRef.current = Array.from({ length: 200 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.4 + 0.1,
      twinkleSpeed: Math.random() * 2 + 1
    }))
  }, [])

  // Handle resize
  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get canvas position for an idea
  const getStarPosition = useCallback((idea) => {
    return {
      x: idea.position.x * dimensions.width,
      y: idea.position.y * dimensions.height
    }
  }, [dimensions])

  // Find star at position
  const findStarAtPosition = useCallback((x, y) => {
    for (const idea of ideasRef.current) {
      const starPos = getStarPosition(idea)
      const size = STATUS_SIZES[idea.status] || 16
      const hitRadius = size + 15 // Generous hit area
      const dx = x - starPos.x
      const dy = y - starPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= hitRadius) {
        return idea
      }
    }
    return null
  }, [getStarPosition])

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const star = findStarAtPosition(x, y)
    if (star && !readOnly) {
      const starPos = getStarPosition(star)
      setDraggingStar(star)
      setDragOffset({ x: x - starPos.x, y: y - starPos.y })
    }
  }, [findStarAtPosition, getStarPosition, readOnly])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (draggingStar && !readOnly) {
      // Update position while dragging (visual only)
      const newX = Math.max(0.05, Math.min(0.95, (x - dragOffset.x) / dimensions.width))
      const newY = Math.max(0.05, Math.min(0.95, (y - dragOffset.y) / dimensions.height))
      draggingStar.position = { x: newX, y: newY }
    } else {
      const star = findStarAtPosition(x, y)
      if (star?.id !== hoveredStar?.id) {
        setHoveredStar(star)
        if (onStarHover) {
          onStarHover(star)
        }
      }
      if (canvasRef.current) {
        canvasRef.current.style.cursor = star ? 'pointer' : 'default'
      }
    }
  }, [draggingStar, dimensions, findStarAtPosition, dragOffset, readOnly, hoveredStar, onStarHover])

  const handleMouseUp = useCallback(() => {
    if (draggingStar && onStarDragEnd && !readOnly) {
      onStarDragEnd(draggingStar.id, draggingStar.position)
    }
    setDraggingStar(null)
  }, [draggingStar, onStarDragEnd, readOnly])

  const handleClick = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const star = findStarAtPosition(x, y)
    if (star && onStarClick) {
      onStarClick(star)
    }
  }, [findStarAtPosition, onStarClick])

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function draw() {
      timeRef.current += 0.016 // ~60fps
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Fill background
      ctx.fillStyle = '#020204'
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Draw background stars (twinkling)
      backgroundStarsRef.current.forEach(star => {
        const twinkle = Math.sin(timeRef.current * star.twinkleSpeed) * 0.3 + 0.7
        const alpha = star.brightness * twinkle
        ctx.beginPath()
        ctx.arc(
          star.x * dimensions.width,
          star.y * dimensions.height,
          star.size,
          0,
          Math.PI * 2
        )
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
        ctx.fill()
      })

      // Draw constellation lines
      constellations.forEach(constellation => {
        const idea1 = ideasRef.current.find(i => i.id === constellation.idea_id_1)
        const idea2 = ideasRef.current.find(i => i.id === constellation.idea_id_2)
        if (idea1 && idea2) {
          const pos1 = getStarPosition(idea1)
          const pos2 = getStarPosition(idea2)

          // Pulsing effect
          const pulse = Math.sin(timeRef.current * 2) * 0.2 + 0.8

          // Main line
          ctx.beginPath()
          ctx.moveTo(pos1.x, pos1.y)
          ctx.lineTo(pos2.x, pos2.y)
          ctx.strokeStyle = `rgba(255, 107, 0, ${0.4 * pulse})`
          ctx.lineWidth = 2
          ctx.stroke()

          // Glow effect
          ctx.strokeStyle = `rgba(255, 107, 0, ${0.15 * pulse})`
          ctx.lineWidth = 6
          ctx.stroke()
        }
      })

      // Draw stars (ideas)
      ideasRef.current.forEach(idea => {
        const pos = getStarPosition(idea)
        const color = STATUS_COLORS[idea.status] || STATUS_COLORS.spark
        const baseSize = STATUS_SIZES[idea.status] || 16
        // Brightness affects glow intensity, not size too much
        const size = baseSize * (0.8 + idea.brightness * 0.4)

        const isHovered = hoveredStar?.id === idea.id
        const isLinkSource = linkSource?.id === idea.id
        const pulse = Math.sin(timeRef.current * 3) * 0.15 + 1

        // Outer glow (large, soft)
        const glowSize = size * (isHovered ? 4 : 3) * pulse
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowSize)
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${isHovered ? 0.5 : 0.3})`)
        gradient.addColorStop(0.4, `rgba(${color.r}, ${color.g}, ${color.b}, ${isHovered ? 0.2 : 0.1})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Inner star core
        const innerSize = size * (isHovered ? 1.4 : 1) * (isLinkSource ? pulse : 1)
        const innerGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, innerSize)
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
        innerGradient.addColorStop(0.2, `rgba(${color.r}, ${color.g}, ${color.b}, 1)`)
        innerGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`)

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, innerSize, 0, Math.PI * 2)
        ctx.fillStyle = innerGradient
        ctx.fill()

        // Link mode ring
        if (isLinkSource) {
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, innerSize + 8, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255, 107, 0, 0.9)'
          ctx.lineWidth = 3
          ctx.stroke()
        }
      })

      // Draw tooltip for hovered star
      if (hoveredStar && !draggingStar) {
        const pos = getStarPosition(hoveredStar)
        const text = hoveredStar.title
        ctx.font = '500 14px Inter, sans-serif'
        const textWidth = ctx.measureText(text).width
        const padding = 14
        const tooltipWidth = textWidth + padding * 2
        const tooltipHeight = 34
        const tooltipX = pos.x - tooltipWidth / 2
        const tooltipY = pos.y - 60

        // Tooltip background
        ctx.fillStyle = 'rgba(10, 10, 10, 0.95)'
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.4)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8)
        ctx.fill()
        ctx.stroke()

        // Tooltip text
        ctx.fillStyle = '#EDEDED'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, pos.x, tooltipY + tooltipHeight / 2)
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    if (dimensions.width > 0 && dimensions.height > 0) {
      draw()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, constellations, hoveredStar, draggingStar, linkMode, linkSource, getStarPosition])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
      />
    </div>
  )
}
