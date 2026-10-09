import test from 'node:test'
import assert from 'node:assert/strict'
import { exteriorSeedPoint } from '../src/seed-connectors.js'

test('anchors keep the required gap outside the seed, including corner directions', () => {
  for (const bounds of [
    {left:20,top:30,right:80,bottom:170},
    {left:100,top:100,right:300,bottom:200},
    {left:-30,top:-80,right:15,bottom:40},
  ]) {
    for (const margin of [5,12,24]) {
      for (let angle=0; angle<360; angle+=3) {
        const radians=angle*Math.PI/180
        const point={x:(bounds.left+bounds.right)/2+Math.cos(radians),y:(bounds.top+bounds.bottom)/2+Math.sin(radians)}
        const result=exteriorSeedPoint(point,bounds,margin)
        const gap=Math.max(bounds.left-result.x,result.x-bounds.right,bounds.top-result.y,result.y-bounds.bottom)
        assert.ok(gap >= margin-1e-8)
      }
    }
  }
})

test('an anchor at the seed center produces a finite point above the seed', () => {
  assert.deepEqual(exteriorSeedPoint({x:50,y:50},{left:0,top:0,right:100,bottom:100},10),{x:50,y:-10})
})

test('curved outlines keep anchors close to the seed with the requested clearance', () => {
  const outline = Array.from({length:48},(_,i)=>({x:50+30*Math.cos(i*Math.PI/24),y:50+40*Math.sin(i*Math.PI/24)}))
  const bounds={left:20,top:10,right:80,bottom:90,outline}
  for(let angle=0;angle<360;angle+=3) {
    const point={x:50+Math.cos(angle*Math.PI/180),y:50+Math.sin(angle*Math.PI/180)}
    const result=exteriorSeedPoint(point,bounds,6)
    const gap=Math.max(...outline.map((a,i)=>{
      const b=outline[(i+1)%outline.length]
      const nx=b.y-a.y,ny=a.x-b.x
      return (nx*(result.x-a.x)+ny*(result.y-a.y))/Math.hypot(nx,ny)
    }))
    assert.ok(Math.abs(gap-6)<1e-8)
  }
})
