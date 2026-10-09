// Project an anchor onto the exterior of the seed's full rotation envelope.
export function exteriorSeedPoint(point, bounds, margin) {
  if (bounds.outline?.length >= 3) {
    const outline = bounds.outline
    const center = outline.reduce((sum, vertex) => ({x:sum.x+vertex.x/outline.length,y:sum.y+vertex.y/outline.length}),{x:0,y:0})
    let dx=point.x-center.x, dy=point.y-center.y
    if (dx===0 && dy===0) dy=-1
    let reach=Infinity
    outline.forEach((a,index) => {
      const b=outline[(index+1)%outline.length]
      let nx=b.y-a.y, ny=a.x-b.x
      if(nx*(a.x-center.x)+ny*(a.y-center.y)<0) {nx=-nx;ny=-ny}
      const direction=nx*dx+ny*dy
      if(direction>0) reach=Math.min(reach,(nx*(a.x-center.x)+ny*(a.y-center.y)+margin*Math.hypot(nx,ny))/direction)
    })
    return {x:center.x+dx*reach,y:center.y+dy*reach}
  }
  const centerX = (bounds.left + bounds.right) / 2
  const centerY = (bounds.top + bounds.bottom) / 2
  let dx = point.x - centerX
  let dy = point.y - centerY
  if (dx === 0 && dy === 0) dy = -1
  const reach = Math.min(
    ((bounds.right - bounds.left) / 2 + margin) / Math.max(Math.abs(dx), .000001),
    ((bounds.bottom - bounds.top) / 2 + margin) / Math.max(Math.abs(dy), .000001),
  )
  return { x: centerX + dx * reach, y: centerY + dy * reach }
}
