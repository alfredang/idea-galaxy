import { useRef, useEffect, useState, useCallback } from 'react'

const STATUS_COLORS = {
  spark: { r: 255, g: 255, b: 255 },
  developing: { r: 255, g: 215, b: 0 },
  refined: { r: 255, g: 107, b: 0 },
  completed: { r: 0, g: 229, b: 255 },
  archived: { r: 128, g: 128, b: 128 }
}

const STATUS_SIZES = {
  spark: 8,
  developing: 12,
  refined: 16,
  completed: 20,
  archived: 6
}

export default function GalaxyCanvas({
  ideas = [],
  constellations = [],
  onStarClick,
  onStarDragEnd,
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
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const animationRef = useRef(null)
  const timeRef = useRef(0)
  const backgroundStarsRef = useRef([])

  // Initialize background stars
  useEffect(() => {
    backgroundStarsRef.current = Array.from({ length: 150 }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.5 + 0.2,
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

  // Convert normalized position to canvas coordinates
  const toCanvasCoords = useCallback((pos) => {
    return {
      x: (pos.x * dimensions.width + pan.x) * zoom,
      y: (pos.y * dimensions.height + pan.y) * zoom
    }
  }, [dimensions, pan, zoom])

  // Convert canvas coordinates to normalized position
  const toNormalizedCoords = useCallback((x, y) => {
    return {
      x: (x / zoom - pan.x) / dimensions.width,
      y: (y / zoom - pan.y) / dimensions.height
    }
  }, [dimensions, pan, zoom])

  // Find star at position
  const findStarAtPosition = useCallback((x, y) => {
    for (const idea of ideas) {
      const starPos = toCanvasCoords(idea.position)
      const size = STATUS_SIZES[idea.status] || 12
      const dx = x - starPos.x
      const dy = y - starPos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= size * zoom + 10) {
        return idea
      }
    }
    return null
  }, [ideas, toCanvasCoords, zoom])

  // Mouse handlers
  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const star = findStarAtPosition(x, y)
    if (star && !readOnly) {
      const starPos = toCanvasCoords(star.position)
      setDraggingStar(star)
      setDragOffset({ x: x - starPos.x, y: y - starPos.y })
    } else {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [findStarAtPosition, toCanvasCoords, pan, readOnly])

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (draggingStar && !readOnly) {
      const newPos = toNormalizedCoords(x - dragOffset.x, y - dragOffset.y)
      // Clamp position
      newPos.x = Math.max(0.05, Math.min(0.95, newPos.x))
      newPos.y = Math.max(0.05, Math.min(0.95, newPos.y))
      draggingStar.position = newPos
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    } else {
      const star = findStarAtPosition(x, y)
      setHoveredStar(star)
      canvasRef.current.style.cursor = star ? 'pointer' : 'grab'
    }
  }, [draggingStar, isPanning, panStart, findStarAtPosition, toNormalizedCoords, dragOffset, readOnly])

  const handleMouseUp = useCallback(() => {
    if (draggingStar && onStarDragEnd && !readOnly) {
      onStarDragEnd(draggingStar.id, draggingStar.position)
    }
    setDraggingStar(null)
    setIsPanning(false)
  }, [draggingStar, onStarDragEnd, readOnly])

  const handleClick = useCallback((e) => {
    if (draggingStar) return // Don't trigger click after drag

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const star = findStarAtPosition(x, y)
    if (star && onStarClick) {
      onStarClick(star)
    }
  }, [findStarAtPosition, onStarClick, draggingStar])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)))
  }, [])

  // Rendering
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    function draw() {
      timeRef.current += 0.016 // ~60fps
      ctx.clearRect(0, 0, dimensions.width, dimensions.height)

      // Fill background
      ctx.fillStyle = '#020204'
      ctx.fillRect(0, 0, dimensions.width, dimensions.height)

      // Draw background stars
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

      // Apply pan and zoom transform
      ctx.save()
      ctx.translate(pan.x * zoom, pan.y * zoom)
      ctx.scale(zoom, zoom)

      // Draw constellation lines
      constellations.forEach(constellation => {
        const idea1 = ideas.find(i => i.id === constellation.idea_id_1)
        const idea2 = ideas.find(i => i.id === constellation.idea_id_2)
        if (idea1 && idea2) {
          const pos1 = { x: idea1.position.x * dimensions.width, y: idea1.position.y * dimensions.height }
          const pos2 = { x: idea2.position.x * dimensions.width, y: idea2.position.y * dimensions.height }

          // Pulsing effect
          const pulse = Math.sin(timeRef.current * 2) * 0.2 + 0.8

          ctx.beginPath()
          ctx.moveTo(pos1.x, pos1.y)
          ctx.lineTo(pos2.x, pos2.y)
          ctx.strokeStyle = `rgba(255, 107, 0, ${0.3 * pulse})`
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Glow effect
          ctx.strokeStyle = `rgba(255, 107, 0, ${0.1 * pulse})`
          ctx.lineWidth = 4
          ctx.stroke()
        }
      })

      // Draw link mode preview line
      if (linkMode && linkSource) {
        const sourcePos = {
          x: linkSource.position.x * dimensions.width,
          y: linkSource.position.y * dimensions.height
        }

        // Animated dashed line to cursor would go here
        ctx.beginPath()
        ctx.setLineDash([5, 5])
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.5)'
        ctx.lineWidth = 2
        // Draw from source to center (simplified)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Draw stars (ideas)
      ideas.forEach(idea => {
        const pos = { x: idea.position.x * dimensions.width, y: idea.position.y * dimensions.height }
        const color = STATUS_COLORS[idea.status] || STATUS_COLORS.spark
        const baseSize = STATUS_SIZES[idea.status] || 12
        const size = baseSize * idea.brightness

        const isHovered = hoveredStar?.id === idea.id
        const isLinkSource = linkSource?.id === idea.id
        const pulse = Math.sin(timeRef.current * 3) * 0.15 + 1

        // Outer glow
        const glowSize = size * (isHovered ? 3 : 2) * pulse
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowSize)
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${isHovered ? 0.6 : 0.3})`)
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${isHovered ? 0.2 : 0.1})`)
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        // Inner star
        const innerSize = size * (isHovered ? 1.3 : 1) * (isLinkSource ? pulse : 1)
        const innerGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, innerSize)
        innerGradient.addColorStop(0, `rgba(255, 255, 255, 1)`)
        innerGradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, 1)`)
        innerGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`)

        ctx.beginPath()
        ctx.arc(pos.x, pos.y, innerSize, 0, Math.PI * 2)
        ctx.fillStyle = innerGradient
        ctx.fill()

        // Link mode ring
        if (isLinkSource) {
          ctx.beginPath()
          ctx.arc(pos.x, pos.y, innerSize + 5, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255, 107, 0, 0.8)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })

      ctx.restore()

      // Draw tooltip for hovered star
      if (hoveredStar && !draggingStar) {
        const pos = toCanvasCoords(hoveredStar.position)
        const text = hoveredStar.title
        ctx.font = '14px Inter, sans-serif'
        const textWidth = ctx.measureText(text).width
        const padding = 12
        const tooltipX = pos.x - textWidth / 2 - padding
        const tooltipY = pos.y - 50

        // Tooltip background
        ctx.fillStyle = 'rgba(10, 10, 10, 0.9)'
        ctx.strokeStyle = 'rgba(255, 107, 0, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(tooltipX, tooltipY, textWidth + padding * 2, 30, 6)
        ctx.fill()
        ctx.stroke()

        // Tooltip text
        ctx.fillStyle = '#EDEDED'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, pos.x, tooltipY + 15)
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
  }, [dimensions, ideas, constellations, hoveredStar, draggingStar, pan, zoom, linkMode, linkSource, toCanvasCoords])

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
        onWheel={handleWheel}
      />
    </div>
  )
}
