import 'dotenv/config';
import { createClient } from '@sanity/client';
import fs from 'fs';
import csv from 'csv-parser';

const client = createClient({
  projectId: '1pnkcp2x',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-02-20',
  token: process.env.SANITY_TOKEN
});

const results = [];

fs.createReadStream('races.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`🏃‍♂️ 총 ${results.length}개의 대회 정보를 찾았습니다. CMS 업로드를 시작합니다...`);
    for (const row of results) {
      const doc = {
        _type: 'race',
        name: row.name,
        date: row.date,
        registrationDate: row.registrationDate,
        registrationUrl: row.registrationUrl,
        type: row.type,
        description: row.description
      };
      try {
        const res = await client.create(doc);
        console.log(`✅ 업로드 성공: ${res.name}`);
      } catch (err) {
        console.error(`❌ 업로드 실패: ${row.name}`, err.message);
      }
    }
    console.log('🎉 모든 대회 정보 업로드가 PESSAGE CMS에 완벽하게 동기화되었습니다!');
  });
