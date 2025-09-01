import React, { useEffect, useRef } from 'react'
import { sampleField as sampleFieldUtil, computeFieldGrid, jacobianAt } from '../utils/field'

type Props = {
  mode: 'arrows'|'heat'|'normalized'
  transform: {rotate:number, scale:number, shear:number}
  grid?: number
  showDiv?: boolean
  showCurl?: boolean
  showLap?: boolean
  particles?: boolean
  streamlines?: boolean
  zoom?: number
}

export default function FieldCanvas({mode, transform, grid=25, showDiv=false, showCurl=false, showLap=false, particles=false, streamlines=false, zoom=1}:Props){
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(()=>{
    const canvas = ref.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    if(!ctx) return

    const c = canvas
    const context = ctx

    // handle HiDPI
    function resize(){
      const w = c.clientWidth
      const h = c.clientHeight
      c.width = Math.max(1, Math.floor(w * devicePixelRatio))
      c.height = Math.max(1, Math.floor(h * devicePixelRatio))
      context.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0)
    }
    resize()
    window.addEventListener('resize', resize)

    const cols = grid
    const rows = Math.max(8, Math.round(cols * c.clientHeight / c.clientWidth))

    // particle state
    const particlesState: {x:number,y:number}[] = []
    for(let p=0;p<100;p++) particlesState.push({x: Math.random()*4-2, y: Math.random()*4-2})

    // draggable control vectors
    type Handle = {x:number,y:number,vx:number,vy:number}
    const handles: Handle[] = [
      {x: -1.2, y: -0.8, vx: 1, vy: 0},
      {x: 0.8, y: 1.0, vx: -1, vy: -0.5}
    ]
    let draggingIndex: number | null = null

    let raf = 0

    function worldToScreen(x:number,y:number){
      const w = c.clientWidth
      const h = c.clientHeight
      const sx = ((x+2)/4 - 0.5)*(1/zoom) + 0.5
      const sy = ((y+2)/4 - 0.5)*(1/zoom) + 0.5
      return {x: sx*w, y: sy*h}
    }

    function screenToWorld(sx:number, sy:number){
      const w = c.clientWidth
      const h = c.clientHeight
      const nx = sx / w
      const ny = sy / h
      const x = ( (nx - 0.5) * zoom + 0.5 )*4 - 2
      const y = ( (ny - 0.5) * zoom + 0.5 )*4 - 2
      return {x,y}
    }

    function draw(){
      const w = c.clientWidth
      const h = c.clientHeight
      context.clearRect(0,0,w,h)

      const colsLocal = grid
      const rowsLocal = Math.max(8, Math.round(colsLocal * h / w))

      // draw grid arrows / heat
      for(let i=0;i<colsLocal;i++){
        for(let j=0;j<rowsLocal;j++){
          const px = (i+0.5)/colsLocal * w
          const py = (j+0.5)/rowsLocal * h
          const {x:fx,y:fy} = screenToWorld(px, py)
          // base field
          let v = sampleFieldUtil(fx, fy)
          // apply handle influence (Gaussian blending)
          for(const h of handles){
            const dxh = fx - h.x
            const dyh = fy - h.y
            const r2 = dxh*dxh + dyh*dyh
            const sigma = 0.6
            const w = Math.exp(-r2/(2*sigma*sigma))
            v = {x: v.x*(1-w) + h.vx*w, y: v.y*(1-w) + h.vy*w}
          }

          // apply transform
          const theta = transform.rotate * Math.PI/180
          const cos = Math.cos(theta)
          const sin = Math.sin(theta)
          let tx = v.x*transform.scale + transform.shear*v.y
          let ty = v.y*transform.scale
          const rx = tx * cos - ty * sin
          const ry = tx * sin + ty * cos
          const mag = Math.hypot(rx, ry)

          if(mode === 'heat'){
            const norm = Math.min(1, mag/3)
            const shade = Math.round(255 * (1 - norm))
            context.fillStyle = `rgb(${shade},${shade},${shade})`
            context.fillRect(px - w/colsLocal/2, py - h/rowsLocal/2, w/colsLocal, h/rowsLocal)
          }

          if(mode === 'arrows' || mode === 'normalized'){
            const len = mode === 'normalized' ? 12 : Math.min(30, mag*10)
            const angle = Math.atan2(ry, rx)
            context.strokeStyle = '#000'
            context.fillStyle = '#000'
            context.lineWidth = 1
            context.beginPath()
            context.moveTo(px, py)
            context.lineTo(px + Math.cos(angle)*len, py + Math.sin(angle)*len)
            context.stroke()
            context.beginPath()
            context.moveTo(px + Math.cos(angle)*len, py + Math.sin(angle)*len)
            context.lineTo(px + Math.cos(angle)*(len-6) + Math.cos(angle+Math.PI*0.6)*6, py + Math.sin(angle)*(len-6) + Math.sin(angle+Math.PI*0.6)*6)
            context.lineTo(px + Math.cos(angle)*(len-6) + Math.cos(angle-Math.PI*0.6)*6, py + Math.sin(angle)*(len-6) + Math.sin(angle-Math.PI*0.6)*6)
            context.fill()
          }
        }
      }

      // differential overlays
      if(showDiv || showCurl || showLap){
        const gridData = computeFieldGrid(sampleFieldUtil, colsLocal, rowsLocal)
        for(let j=0;j<rowsLocal;j++){
          for(let i=0;i<colsLocal;i++){
            const px = (i+0.5)/colsLocal * w
            const py = (j+0.5)/rowsLocal * h
            if(showDiv){
              const v = gridData.div[j][i]
              const shade = Math.max(0, Math.min(255, Math.round(127 - v*50)))
              context.fillStyle = `rgb(${shade},${shade},${shade})`
              context.fillRect(px - w/colsLocal/2, py - h/rowsLocal/2, w/colsLocal, h/rowsLocal)
            }
            if(showCurl){
              const v = gridData.curl[j][i]
              context.strokeStyle = '#000'
              context.beginPath()
              context.arc(px,py,6,0,Math.PI*2*v/6)
              context.stroke()
            }
            if(showLap){
              const v = gridData.lap[j][i]
              const shade = Math.max(0, Math.min(255, Math.round(127 - v*10)))
              context.fillStyle = `rgb(${shade},${shade},${shade})`
              context.fillRect(px - w/colsLocal/2, py - h/rowsLocal/2, w/colsLocal, h/rowsLocal)
            }
          }
        }
      }

      // particles
      if(particles){
        context.fillStyle = '#000'
        for(let k=0;k<particlesState.length;k++){
          const p = particlesState[k]
          const f = sampleFieldUtil(p.x,p.y)
          const dt = 0.02
          p.x += f.x*dt
          p.y += f.y*dt
          // wrap
          if(p.x < -2) p.x = 2
          if(p.x > 2) p.x = -2
          if(p.y < -2) p.y = 2
          if(p.y > 2) p.y = -2
          const s = worldToScreen(p.x,p.y)
          context.beginPath(); context.arc(s.x,s.y,2,0,Math.PI*2); context.fill()
        }
      }

        // render handles on top
        for(let hi=0; hi<handles.length; hi++){
          const h = handles[hi]
          const s = worldToScreen(h.x, h.y)
          context.save()
          context.fillStyle = '#fff'
          context.strokeStyle = '#000'
          context.lineWidth = 1
          context.beginPath()
          context.arc(s.x, s.y, 8, 0, Math.PI*2)
          context.fill()
          context.stroke()
          // arrow for vector
          context.beginPath()
          context.moveTo(s.x, s.y)
          const av = worldToScreen(h.x + 0.3*h.vx, h.y + 0.3*h.vy)
          context.lineTo(av.x, av.y)
          context.stroke()
          context.restore()
        }

      // streamlines
      if(streamlines){
        context.strokeStyle = '#000'
        for(let s=0;s<30;s++){
          let sx = Math.random()*4-2
          let sy = Math.random()*4-2
          context.beginPath()
          const s0 = worldToScreen(sx,sy)
          context.moveTo(s0.x, s0.y)
          for(let t=0;t<200;t++){
            const f = sampleFieldUtil(sx, sy)
            const dt = 0.02
            sx += f.x*dt
            sy += f.y*dt
            const p = worldToScreen(sx,sy)
            context.lineTo(p.x,p.y)
          }
          context.stroke()
        }
      }

      raf = requestAnimationFrame(draw)
    }

  function handleClick(e: MouseEvent){
      const rect = c.getBoundingClientRect()
      const cx = (e.clientX - rect.left) / rect.width
      const cy = (e.clientY - rect.top) / rect.height
      const fx = cx*4 - 2
      const fy = cy*4 - 2
      const {j11,j12,j21,j22,eigA,eigB} = jacobianAt(sampleFieldUtil, fx, fy)
      draw()
      context.save()
      context.strokeStyle = '#000'
      context.fillStyle = '#000'
      context.beginPath()
      context.arc(cx*c.clientWidth, cy*c.clientHeight, 6, 0, Math.PI*2)
      context.fill()
      context.restore()

      context.save()
      context.fillStyle = '#000'
      context.font = '12px monospace'
      context.fillText(`Jacobian: [${j11.toFixed(2)}, ${j12.toFixed(2)}; ${j21.toFixed(2)}, ${j22.toFixed(2)}]`, 10, 20)
      context.fillText(`Eigen: ${eigA.toFixed(2)}, ${eigB.toFixed(2)}`, 10, 36)
      context.restore()
    }

    // dragging handlers
    function onPointerDown(e: PointerEvent){
      const rect = c.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      for(let i=0;i<handles.length;i++){
        const h = handles[i]
        const s = worldToScreen(h.x,h.y)
        const d2 = (s.x - sx)*(s.x - sx) + (s.y - sy)*(s.y - sy)
        if(d2 < 8*8){
          draggingIndex = i
          c.setPointerCapture(e.pointerId)
          return
        }
      }
    }

    function onPointerMove(e: PointerEvent){
      if(draggingIndex === null) return
      const rect = c.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const w = screenToWorld(sx, sy)
      const h = handles[draggingIndex]
      h.x = w.x
      h.y = w.y
    }

    function onPointerUp(e: PointerEvent){
      if(draggingIndex !== null){
        draggingIndex = null
      }
    }

    c.addEventListener('pointerdown', onPointerDown)
    c.addEventListener('pointermove', onPointerMove)
    c.addEventListener('pointerup', onPointerUp)

    c.addEventListener('click', handleClick)
    draw()

    return ()=>{
      c.removeEventListener('click', handleClick)
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [mode, transform, grid, showDiv, showCurl, showLap, particles, streamlines, zoom])

  return (
    <div className="canvas-wrap">
      <canvas ref={ref} style={{width: '100%', height: '70vh', border: '1px solid #000'}} />
    </div>
  )
}
