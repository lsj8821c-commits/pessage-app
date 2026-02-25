import {useCallback} from 'react'
import {FileInput, useFormValue, useClient} from 'sanity'

export default function GpxFileInput(props) {
  const client = useClient({apiVersion: '2024-01-01'})
  const documentId = useFormValue(['_id'])

  const handleChange = useCallback(
    async (value) => {
      props.onChange(value)

      const assetRef = value?.value?.asset?._ref
      if (!assetRef) return

      try {
        const asset = await client.fetch(`*[_id == $ref][0]{ url }`, {ref: assetRef})
        if (!asset?.url) return

        const response = await fetch(asset.url)
        const text = await response.text()
        const parser = new DOMParser()
        const gpx = parser.parseFromString(text, 'application/xml')
        const trkpts = gpx.querySelectorAll('trkpt')

        let totalDistance = 0
        let elevationGain = 0

        for (let i = 1; i < trkpts.length; i++) {
          const lat1 = parseFloat(trkpts[i - 1].getAttribute('lat'))
          const lon1 = parseFloat(trkpts[i - 1].getAttribute('lon'))
          const lat2 = parseFloat(trkpts[i].getAttribute('lat'))
          const lon2 = parseFloat(trkpts[i].getAttribute('lon'))
          const ele1 = parseFloat(trkpts[i - 1].querySelector('ele')?.textContent || 0)
          const ele2 = parseFloat(trkpts[i].querySelector('ele')?.textContent || 0)

          totalDistance += haversine(lat1, lon1, lat2, lon2)
          if (ele2 > ele1) elevationGain += ele2 - ele1
        }

        await client
          .patch(documentId)
          .set({
            distance: (totalDistance / 1000).toFixed(1) + 'km',
            elevationGain: Math.round(elevationGain) + 'm',
          })
          .commit()
      } catch (e) {
        console.error('GPX 파싱 실패:', e)
      }
    },
    [client, documentId, props],
  )

  return <FileInput {...props} onChange={handleChange} />
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
