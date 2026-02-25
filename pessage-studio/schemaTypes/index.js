/**
 * PESSAGE CMS 통합 스키마 설정
 * 위치: pessage-studio/schemaTypes/index.js
 */

import GpxFileInput from '../components/GpxFileInput'

// 1. Journal (에세이/저널)
const journal = {
  name: 'journal',
  title: 'Journal (에세이)',
  type: 'document',
  fields: [
    { name: 'title', title: '제목', type: 'string' },
    { name: 'subtitle', title: '부제 (예: Season 01: The Mist)', type: 'string' },
    { name: 'category', title: '카테고리', type: 'string', options: { list: ['ESSAY', 'INTERVIEW', 'GUIDE'] } },
    { name: 'publishedAt', title: '발행일', type: 'datetime' },
    { name: 'coverImage', title: '메인 커버 이미지', type: 'image', options: { hotspot: true } },
    {
      name: 'content',
      title: '에디토리얼 본문',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'caption', title: '이미지 캡션', type: 'string' }]
        },
        {
          name: 'quote',
          title: '인용구 (Quote)',
          type: 'object',
          fields: [
            { name: 'text', title: '인용 내용', type: 'text' },
            { name: 'author', title: '작성자', type: 'string' }
          ]
        }
      ]
    }
  ]
}

// 2. Route (추천 루트)
const route = {
  name: 'route',
  title: 'Route (추천 루트)',
  type: 'document',
  preview: { select: { title: 'name' } },
  fields: [
    { name: 'name', title: '이름', type: 'string' },
    { name: 'title', title: '코스명', type: 'string' },
    { name: 'region', title: '지역', type: 'string', options: { list: ['SEOUL', 'GYEONGGI', 'GANGWON', 'CHUNGCHEONG', 'GYEONGSANG', 'JEJU'] } },
    { name: 'type', title: '루트 유형', type: 'string', options: { list: ['ORIGINAL', 'TRAIL', 'ROAD'] } },
    { name: 'difficulty', title: '난이도', type: 'string', options: { list: ['EASY', 'MODERATE', 'HARD'] } },
    { name: 'gpxFile', title: 'GPX 파일', type: 'file', components: { input: GpxFileInput } },
    { name: 'distance', title: '거리 (km)', type: 'string', readOnly: true },
    { name: 'elevationGain', title: '누적 상승 (m)', type: 'string', readOnly: true },
    { name: 'description', title: '코스 설명 (요약)', type: 'text' },
    { name: 'playlistUrl', title: '추천 플레이리스트 (YouTube URL)', type: 'url' },
    {
      name: 'body',
      title: '본문',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true }, fields: [{ name: 'caption', title: '이미지 설명', type: 'string' }] }
      ]
    },
    {
      name: 'spots',
      title: '추천 스팟',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'name', title: '스팟 이름', type: 'string' },
          { name: 'category', title: '유형', type: 'string', options: { list: ['CAFE', 'SAUNA', 'RESTAURANT', 'VIEWPOINT'] } },
          { name: 'address', title: '주소', type: 'string' },
          {
            name: 'body',
            title: '스팟 설명',
            type: 'array',
            of: [
              { type: 'block' },
              { type: 'image', options: { hotspot: true }, fields: [{ name: 'caption', title: '이미지 설명', type: 'string' }] }
            ]
          }
        ]
      }]
    }
  ]
}

// 3. Gear (추천 장비)
const gear = {
  name: 'gear',
  title: 'Gear (추천 장비)',
  type: 'document',
  fields: [
    { name: 'name', title: '제품명', type: 'string' },
    { name: 'brand', title: '브랜드', type: 'string' },
    { name: 'category', title: '카테고리', type: 'string', options: { list: ['PACK', 'APPAREL', 'EYEWEAR', 'ACCESSORY'] } },
    { name: 'slug', title: 'Slug (URL)', type: 'slug', options: { source: 'name', maxLength: 96 } },
    { name: 'publishedAt', title: '발행일', type: 'datetime' },
    { name: 'note', title: '에디터 노트 (목록 요약)', type: 'text' },
    { name: 'image', title: '대표 이미지', type: 'image', options: { hotspot: true } },
    {
      name: 'body',
      title: '본문 (Portable Text)',
      type: 'array',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [{ name: 'caption', title: '이미지 캡션', type: 'string' }]
        }
      ]
    }
  ]
}

// 4. Session (대회/이벤트)
const session = {
  name: 'session',
  title: 'Session (대회/이벤트)',
  type: 'document',
  fields: [
    { name: 'name', title: '대회/이벤트 이름', type: 'string', validation: Rule => Rule.required() },
    { name: 'date', title: '개최 날짜', type: 'date', options: { dateFormat: 'YYYY-MM-DD' } },
    { name: 'registrationDate', title: '접수 기간', type: 'string' },
    { name: 'registrationUrl', title: '접수처 링크', type: 'url' },
    { name: 'type', title: '유형', type: 'string', options: { list: ['TRAIL', 'ROAD', 'EVENT', 'GROUP_RUN'] } },
    { name: 'location', title: '장소', type: 'string' },
    { name: 'description', title: '상세 설명', type: 'text' },
  ]
}

// ⚠️ 이 부분이 핵심입니다! 정의한 스키마들을 배열로 묶어서 내보내야 Sanity Studio가 인식합니다.
export const schemaTypes = [journal, route, gear, session]
