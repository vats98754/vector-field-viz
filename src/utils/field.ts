// Numeric utilities for 2D vector fields on a regular grid
export type Vec2 = {x:number,y:number}

// sample field - default rotational + small perturbation
export function sampleField(x:number,y:number):Vec2{
  return {x: -y + Math.sin(x), y: x + Math.cos(y)}
}

// finite difference divergence and curl on a regular grid of points
export function computeFieldGrid(func:(x:number,y:number)=>Vec2, cols:number, rows:number, xmin=-2, xmax=2, ymin=-2, ymax=2){
  const dx = (xmax-xmin)/(cols-1)
  const dy = (ymax-ymin)/(rows-1)
  const u = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
  const v = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
  const div = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
  const curl = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
  const lap = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))

  for(let j=0;j<rows;j++){
    const y = ymin + j*dy
    for(let i=0;i<cols;i++){
      const x = xmin + i*dx
      const f = func(x,y)
      u[j][i] = f.x
      v[j][i] = f.y
    }
  }

  for(let j=0;j<rows;j++){
    for(let i=0;i<cols;i++){
      // central diffs where possible
      const im = Math.max(0,i-1)
      const ip = Math.min(cols-1,i+1)
      const jm = Math.max(0,j-1)
      const jp = Math.min(rows-1,j+1)
      const dudx = (u[j][ip] - u[j][im])/( (ip-im)*dx )
      const dvdy = (v[jp][i] - v[jm][i])/( (jp-jm)*dy )
      const dudy = (u[jp][i] - u[jm][i])/( (jp-jm)*dy )
      const dvdx = (v[j][ip] - v[j][im])/( (ip-im)*dx )
      div[j][i] = dudx + dvdy
      curl[j][i] = dvdx - dudy
      // Laplacian of magnitude roughly
      const magc = Math.hypot(u[j][i], v[j][i])
      const mag_ip = Math.hypot(u[j][ip], v[j][ip])
      const mag_im = Math.hypot(u[j][im], v[j][im])
      const mag_jp = Math.hypot(u[jp][i], v[jp][i])
      const mag_jm = Math.hypot(u[jm][i], v[jm][i])
      lap[j][i] = (mag_ip + mag_im + mag_jp + mag_jm - 4*magc)/(dx*dy)
    }
  }

  return {u,v,div,curl,lap,xmin,xmax,ymin,ymax,dx,dy,cols,rows}
}

// point Jacobian (numerical)
export function jacobianAt(func:(x:number,y:number)=>Vec2, x:number, y:number, eps=1e-3){
  const f0 = func(x,y)
  const fx = func(x+eps,y)
  const fy = func(x,y+eps)
  const j11 = (fx.x - f0.x)/eps
  const j12 = (fy.x - f0.x)/eps
  const j21 = (fx.y - f0.y)/eps
  const j22 = (fy.y - f0.y)/eps
  const tr = j11 + j22
  const det = j11*j22 - j12*j21
  const disc = tr*tr - 4*det
  let eigA:number, eigB:number
  if(disc >= 0){
    eigA = (tr + Math.sqrt(disc))/2
    eigB = (tr - Math.sqrt(disc))/2
  } else { eigA = tr/2; eigB = tr/2 }
  return {j11,j12,j21,j22,eigA,eigB}
}

// Jacobi Poisson solver to recover scalar potential phi from divergence: ∇² phi = div (discrete)
export function solvePoisson(divGrid:number[][], dx:number, dy:number, iterations=200){
  const rows = divGrid.length
  const cols = divGrid[0].length
  let phi = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
  const dx2 = dx*dx
  const dy2 = dy*dy
  const denom = 2*(dx2+dy2)

  for(let it=0; it<iterations; it++){
    const newPhi = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
    for(let j=1;j<rows-1;j++){
      for(let i=1;i<cols-1;i++){
        newPhi[j][i] = ((phi[j][i+1]+phi[j][i-1])*dy2 + (phi[j+1][i]+phi[j-1][i])*dx2 - divGrid[j][i]*dx2*dy2)/denom
      }
    }
    phi = newPhi
  }
  return phi
}

// gradient of scalar phi
export function gradPhi(phi:number[][], dx:number, dy:number){
  const rows = phi.length
  const cols = phi[0].length
  const gx = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
  const gy = new Array(rows).fill(0).map(()=>new Array(cols).fill(0))
  for(let j=0;j<rows;j++){
    for(let i=0;i<cols;i++){
      const im = Math.max(0,i-1)
      const ip = Math.min(cols-1,i+1)
      const jm = Math.max(0,j-1)
      const jp = Math.min(rows-1,j+1)
      gx[j][i] = (phi[j][ip] - phi[j][im])/(2*dx)
      gy[j][i] = (phi[jp][i] - phi[jm][i])/(2*dy)
    }
  }
  return {gx,gy}
}
