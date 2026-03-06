/**
 * sync-notion-to-sanity.js
 * JSON 파일 → Sanity CMS 업로드
 *
 * 사용법:
 *   node scripts/sync-notion-to-sanity.js --input scripts/data.json --type journal
 *   node scripts/sync-notion-to-sanity.js --input scripts/data.json --type session
 */

import { createClient } from '@sanity/client';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── 환경변수 로드 (.env.local) ─────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
try {
  const envFile = readFileSync(envPath, 'utf-8');
  for (const line of envFile.split('\n')) {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
  }
} catch {
  // .env.local 없으면 시스템 환경변수 사용
}

// ── CLI 인수 파싱 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const inputPath = getArg('--input');
const type = getArg('--type');

if (!inputPath || !type) {
  console.error('사용법: node scripts/sync-notion-to-sanity.js --input [파일경로] --type [journal|session]');
  process.exit(1);
}
if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('SANITY_WRITE_TOKEN 환경변수가 없습니다. .env.local에 추가해주세요.');
  process.exit(1);
}

// ── Sanity 클라이언트 ──────────────────────────────────────────────
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '1pnkcp2x',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// ── JSON 읽기 ──────────────────────────────────────────────────────
const absInput = resolve(process.cwd(), inputPath);
let data;
try {
  data = JSON.parse(readFileSync(absInput, 'utf-8'));
} catch (err) {
  console.error(`JSON 파일 읽기 실패: ${absInput}\n${err.message}`);
  process.exit(1);
}

// ── 유틸: 텍스트 → Portable Text ──────────────────────────────────
function textToPortableText(text) {
  if (!text) return [];
  return text.split('\n').flatMap((line) => {
    if (!line.trim()) return [];
    let style = 'normal';
    let content = line;
    if (line.startsWith('### ')) { style = 'h3'; content = line.slice(4); }
    else if (line.startsWith('## '))  { style = 'h2'; content = line.slice(3); }
    else if (line.startsWith('# '))   { style = 'h1'; content = line.slice(2); }
    else if (line.startsWith('> '))   { style = 'blockquote'; content = line.slice(2); }
    return [{
      _type: 'block',
      _key: Math.random().toString(36).slice(2, 10),
      style,
      children: [{ _type: 'span', _key: Math.random().toString(36).slice(2, 10), text: content.trim(), marks: [] }],
      markDefs: [],
    }];
  });
}

// ── JOURNAL 업로드 ─────────────────────────────────────────────────
async function syncJournal(d) {
  if (!d.title) { console.error('title 필드가 필요합니다.'); process.exit(1); }

  const slug = d.slug || d.title.toLowerCase().replace(/[^a-z0-9가-힣\s-]/g, '').replace(/\s+/g, '-').slice(0, 96);

  const doc = {
    _type: 'journal',
    title: d.title,
    ...(d.subtitle    && { subtitle: d.subtitle }),
    ...(d.category    && { category: d.category }),
    ...(d.publishedAt && { publishedAt: d.publishedAt }),
    slug: { _type: 'slug', current: slug },
    ...(d.playlistUrl && { playlistUrl: d.playlistUrl }),
    content: textToPortableText(d.content || ''),
  };

  const existing = await sanity.fetch(
    `*[_type == "journal" && slug.current == $slug][0]._id`,
    { slug }
  );

  if (existing) {
    await sanity.patch(existing).set(doc).commit();
    console.log(`✓ Journal 업데이트됨 (slug: ${slug})`);
  } else {
    const created = await sanity.create(doc);
    console.log(`✓ Journal 생성됨 (ID: ${created._id}, slug: ${slug})`);
  }
}

// ── SESSION 업로드 ─────────────────────────────────────────────────
async function syncSessions(sessions) {
  if (!Array.isArray(sessions)) { sessions = [sessions]; }
  let success = 0;

  for (const d of sessions) {
    if (!d.name) { console.warn('  ⚠ name 없는 항목 스킵'); continue; }

    const doc = {
      _type: 'session',
      name: d.name,
      ...(d.date            && { date: d.date }),
      ...(d.type            && { type: d.type }),
      ...(d.location        && { location: d.location }),
      ...(d.description     && { description: d.description }),
      ...(d.registrationUrl && { registrationUrl: d.registrationUrl }),
      ...(d.status          && { status: d.status }),
    };

    const existing = await sanity.fetch(
      `*[_type == "session" && name == $name && date == $date][0]._id`,
      { name: doc.name, date: doc.date || '' }
    );

    if (existing) {
      await sanity.patch(existing).set(doc).commit();
      console.log(`  ✓ Session 업데이트됨: ${doc.name}`);
    } else {
      const created = await sanity.create(doc);
      console.log(`  ✓ Session 생성됨: ${doc.name} (ID: ${created._id})`);
    }
    success++;
  }

  console.log(`\n완료: ${success}/${sessions.length} Session 처리됨`);
}

// ── 메인 ──────────────────────────────────────────────────────────
try {
  if (type === 'journal') {
    await syncJournal(data);
  } else if (type === 'session') {
    await syncSessions(data);
  } else {
    console.error(`알 수 없는 type: "${type}". journal 또는 session을 사용해주세요.`);
    process.exit(1);
  }
  console.log('\n✅ 동기화 완료');
} catch (err) {
  console.error('\n❌ 오류 발생:', err.message);
  process.exit(1);
}
