import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const client = createClient({
  projectId: '1pnkcp2x',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
})

const rows = []

fs.createReadStream(path.join(__dirname, 'races.csv'))
  .pipe(csv())
  .on('data', (row) => rows.push(row))
  .on('end', async () => {
    console.log(`총 ${rows.length}개 레코드 마이그레이션 시작...\n`)

    for (const row of rows) {
      // "2026-10-18 예정" 같은 날짜에서 날짜 부분만 추출
      const rawDate = row.date?.trim() ?? ''
      const date = rawDate.replace(/\s*(예정|확정).*$/, '').trim() || undefined

      const doc = {
        _type: 'session',
        name: row.name?.trim(),
        ...(date && { date }),
        registrationDate: row.registrationDate?.trim() || undefined,
        registrationUrl: row.registrationUrl?.trim() || undefined,
        type: row.type?.trim() || undefined,
        description: row.description?.trim() || undefined,
      }

      try {
        const result = await client.create(doc)
        console.log(`✓ ${doc.name} (${result._id})`)
      } catch (err) {
        console.error(`✗ ${doc.name}: ${err.message}`)
      }
    }

    console.log('\n마이그레이션 완료.')
  })
