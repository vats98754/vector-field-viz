import React, { useState } from 'react'
import FieldCanvas from './components/FieldCanvas'

export default function App(){
  const [mode, setMode] = useState<'arrows'|'heat'|'normalized'>('arrows')
  const [transform, setTransform] = useState({rotate:0, scale:1, shear:0})
  const [grid, setGrid] = useState(25)
  const [showDiv, setShowDiv] = useState(false)
  const [showCurl, setShowCurl] = useState(false)
  const [showLap, setShowLap] = useState(false)
  const [particles, setParticles] = useState(false)
  const [streamlines, setStreamlines] = useState(false)
  const [zoom, setZoom] = useState(1)

  return (
    <div className="app">
      <header>
        <div className="brand">vector-field-viz — interactive</div>
        <div className="muted">Black & White • Real-time</div>
      </header>

      <div className="container">
        <aside className="sidebar">
          <div className="control-group">
            <div className="control-note">Views</div>
            <div className="control-row">
              <label><input type="radio" checked={mode==='arrows'} onChange={()=>setMode('arrows')} /> Arrows</label>
              <label><input type="radio" checked={mode==='heat'} onChange={()=>setMode('heat')} /> Heatmap</label>
              <label><input type="radio" checked={mode==='normalized'} onChange={()=>setMode('normalized')} /> Normalized</label>
            </div>
          </div>

          <div className="control-group">
            <div className="control-note">Transforms</div>
            <div className="transform-controls">
              <label>Rotate: <input type="range" min="-180" max="180" value={transform.rotate} onChange={e=>setTransform({...transform, rotate: Number(e.target.value)})} /></label>
              <label>Scale: <input type="range" min="0.1" max="3" step="0.1" value={transform.scale} onChange={e=>setTransform({...transform, scale: Number(e.target.value)})} /></label>
              <label>Shear: <input type="range" min="-1" max="1" step="0.01" value={transform.shear} onChange={e=>setTransform({...transform, shear: Number(e.target.value)})} /></label>
            </div>
          </div>

          <div className="control-group">
            <div className="control-note">Field & Interaction</div>
            <div className="control-row">
              <label>Grid: <input type="range" min="8" max="60" value={grid} onChange={e=>setGrid(Number(e.target.value))} /></label>
            </div>
            <div className="control-row">
              <label><input type="checkbox" checked={showDiv} onChange={e=>setShowDiv(e.target.checked)} /> Divergence</label>
              <label><input type="checkbox" checked={showCurl} onChange={e=>setShowCurl(e.target.checked)} /> Curl</label>
            </div>
            <div className="control-row">
              <label><input type="checkbox" checked={showLap} onChange={e=>setShowLap(e.target.checked)} /> Laplacian</label>
              <label><input type="checkbox" checked={particles} onChange={e=>setParticles(e.target.checked)} /> Particles</label>
            </div>
            <div className="control-row">
              <label><input type="checkbox" checked={streamlines} onChange={e=>setStreamlines(e.target.checked)} /> Streamlines</label>
            </div>
            <div className="control-row">
              <label>Zoom: <input type="range" min="0.25" max="3" step="0.05" value={zoom} onChange={e=>setZoom(Number(e.target.value))} /></label>
            </div>
            <div className="control-row">
              <label><input type="checkbox" /> Enable draggable control vectors</label>
            </div>
          </div>

          <div className="control-group muted">
            Tip: click on the canvas to inspect local Jacobian & eigenvalues.
          </div>
        </aside>

        <main className="main">
          <div className="canvas-wrap">
            <FieldCanvas mode={mode} transform={transform} grid={grid} showDiv={showDiv} showCurl={showCurl} showLap={showLap} particles={particles} streamlines={streamlines} zoom={zoom} />
          </div>
        </main>
      </div>

      <footer className="footer">
        Minimal black-and-white vector field visualizer — interactive. Built for exploration.
      </footer>
    </div>
  )
}
