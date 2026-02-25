// ------------------------------------------------------------------
// 🏃‍♂️ PESSAGE Session (대회/이벤트) CSV 자동 업로드 스크립트
// 실행 방법: node import-races.js
// ------------------------------------------------------------------

import 'dotenv/config';
import { createClient } from '@sanity/client';
import fs from 'fs';
import csv from 'csv-parser';

// 1. Sanity 클라이언트 설정 (제민님의 인증 토큰 장착 완료!)
const client = createClient({
  projectId: '1pnkcp2x',     // PESSAGE 프로젝트 ID
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-02-20',
  token: process.env.SANITY_TOKEN 
});

const results = [];

// 2. races.csv 파일 읽기
// 엑셀에서 데이터를 작성한 후 'races.csv'라는 이름으로 같은 폴더에 저장해야 합니다.
fs.createReadStream('races.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    console.log(`🏃‍♂️ 총 ${results.length}개의 대회 정보를 찾았습니다. CMS 업로드를 시작합니다...`);
    
    for (const row of results) {
      // 3. Sanity 스키마 구조에 맞게 데이터 매핑
      const doc = {
        _type: 'race',
        name: row.name,
        date: row.date,                     // 형식: 2026-10-12
        registrationDate: row.registrationDate, // 형식: 2026.03.01 ~ 선착순
        registrationUrl: row.registrationUrl,   // 형식: https://...
        type: row.type,                     // TRAIL, ROAD, EVENT 중 택 1
        description: row.description
      };

      try {
        // Sanity에 데이터 생성 (Create)
        const res = await client.create(doc);
        console.log(`✅ 업로드 성공: ${res.name}`);
      } catch (err) {
        console.error(`❌ 업로드 실패: ${row.name}`, err.message);
      }
    }
    
    console.log('🎉 모든 대회 정보 업로드가 PESSAGE CMS에 완벽하게 동기화되었습니다!');
  });