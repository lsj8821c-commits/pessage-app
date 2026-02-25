import {createClient} from '@sanity/client'
import {createReadStream} from 'fs'
import {DOMParser} from '@xmldom/xmldom'
import fetch from 'node-fetch'

const client = createClient({
  projectId: '1pnkcp2x',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_TOKEN,
  useCdn: false,
})

function haversine(lat1,lon1,lat2,lon2){
  const R=6371000,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

const routes = await client.fetch(`*[_type=="route" && defined(gpxFile.asset->url)]{ _id, name, "gpxUrl": gpxFile.asset->url }`)

for (const route of routes) {
  try {
    const res = await fetch(route.gpxUrl)
    const text = await res.text()
    const gpx = new DOMParser().parseFromString(text, 'text/xml')
    const trkpts = gpx.getElementsByTagName('trkpt')
    let totalDistance=0, elevationGain=0
    for(let i=1;i<trkpts.length;i++){
      const lat1=parseFloat(trkpts[i-1].getAttribute('lat'))
      const lon1=parseFloat(trkpts[i-1].getAttribute('lon'))
      const lat2=parseFloat(trkpts[i].getAttribute('lat'))
      const lon2=parseFloat(trkpts[i].getAttribute('lon'))
      const ele1=parseFloat(trkpts[i-1].getElementsByTagName('ele')[0]?.textContent||0)
      const ele2=parseFloat(trkpts[i].getElementsByTagName('ele')[0]?.textContent||0)
      totalDistance+=haversine(lat1,lon1,lat2,lon2)
      if(ele2>ele1) elevationGain+=ele2-ele1
    }
    await client.patch(route._id).set({
      distance: (totalDistance/1000).toFixed(1)+'km',
      elevationGain: Math.round(elevationGain)+'m',
    }).commit()
    console.log(`✓ ${route.name}: ${(totalDistance/1000).toFixed(1)}km / ${Math.round(elevationGain)}m`)
  } catch(e) {
    console.error(`✗ ${route.name}:`, e.message)
  }
}
