/**
 * sync-notion-to-sanity.js
 * 노션 페이지 → Sanity CMS 자동 동기화
 *
 * 사용법:
 *   node scripts/sync-notion-to-sanity.js --page [NOTION_PAGE_ID] --type journal
 *   node scripts/sync-notion-to-sanity.js --page [NOTION_PAGE_ID] --type session
 */

import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
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

// ── 클라이언트 초기화 ──────────────────────────────────────────────
const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const sanity = createClient({
  projectId: '1pnkcp2x',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

// ── CLI 인수 파싱 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const pageId = getArg('--page');
const type = getArg('--type');

if (!pageId || !type) {
  console.error('사용법: node scripts/sync-notion-to-sanity.js --page [ID] --type [journal|session]');
  process.exit(1);
}
if (!process.env.NOTION_TOKEN) {
  console.error('NOTION_TOKEN 환경변수가 없습니다. .env.local에 추가해주세요.');
  process.exit(1);
}
if (!process.env.SANITY_WRITE_TOKEN) {
  console.error('SANITY_WRITE_TOKEN 환경변수가 없습니다. .env.local에 추가해주세요.');
  process.exit(1);
}

// ── 유틸: 노션 페이지의 모든 블록 가져오기 ────────────────────────
async function getBlocks(blockId) {
  const blocks = [];
  let cursor;
  do {
    const res = await notion.blocks.children.list({
      block_id: blockId,
      start_cursor: cursor,
      page_size: 100,
    });
    blocks.push(...res.results);
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return blocks;
}

// ── 유틸: 노션 리치텍스트 → 문자열 ───────────────────────────────
function richText(arr = []) {
  return arr.map((t) => t.plain_text).join('');
}

// ── 유틸: 테이블 블록 파싱 (key-value 객체 반환) ──────────────────
async function parseTable(tableBlock) {
  const rows = await getBlocks(tableBlock.id);
  const result = {};
  for (const row of rows) {
    if (row.type !== 'table_row') continue;
    const cells = row.table_row.cells;
    if (cells.length >= 2) {
      const key = richText(cells[0]).trim();
      const val = richText(cells[1]).trim();
      if (key) result[key] = val;
    }
  }
  return result;
}

// ── 유틸: 마크다운 → Portable Text 변환 ──────────────────────────
function mdToPortableText(md) {
  const lines = md.split('\n');
  const blocks = [];

  for (const line of lines) {
    if (!line.trim() || line.trim() === '---') continue;

    let style = 'normal';
    let text = line;

    if (line.startsWith('### ')) { style = 'h3'; text = line.slice(4); }
    else if (line.startsWith('## ')) { style = 'h2'; text = line.slice(3); }
    else if (line.startsWith('# ')) { style = 'h1'; text = line.slice(2); }
    else if (line.startsWith('> ')) { style = 'blockquote'; text = line.slice(2); }

    // 인라인 마크 파싱 (bold, italic)
    const children = parseInline(text.trim());
    if (children.length > 0) {
      blocks.push({ _type: 'block', _key: randomKey(), style, children });
    }
  }
  return blocks;
}

function parseInline(text) {
  // 간단한 인라인 파싱: **bold**, _italic_, 일반텍스트
  const children = [];
  const regex = /(\*\*(.+?)\*\*|_(.+?)_|([^*_]+))/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match[2]) {
      children.push({ _type: 'span', _key: randomKey(), text: match[2], marks: ['strong'] });
    } else if (match[3]) {
      children.push({ _type: 'span', _key: randomKey(), text: match[3], marks: ['em'] });
    } else if (match[4]) {
      children.push({ _type: 'span', _key: randomKey(), text: match[4], marks: [] });
    }
  }
  return children.length ? children : [{ _type: 'span', _key: randomKey(), text, marks: [] }];
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10);
}

// ── JOURNAL 동기화 ─────────────────────────────────────────────────
async function syncJournal(notionPageId) {
  console.log(`\nJournal 파싱 중... (페이지 ID: ${notionPageId})`);
  const blocks = await getBlocks(notionPageId);

  let schemaData = {};
  let bodyStart = false;
  const bodyBlocks = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    // SCHEMA 테이블 찾기
    if (block.type === 'heading_2') {
      const heading = richText(block.heading_2.rich_text);
      if (heading.startsWith('SCHEMA:')) {
        // 다음 table 블록
        for (let j = i + 1; j < blocks.length; j++) {
          if (blocks[j].type === 'table') {
            schemaData = await parseTable(blocks[j]);
            break;
          }
          if (blocks[j].type === 'heading_2') break;
        }
      }
      if (heading === '본문 (body)' || heading === '본문') {
        bodyStart = true;
        continue;
      }
    }

    if (bodyStart) {
      bodyBlocks.push(block);
    }
  }

  // 본문 → Portable Text
  const mdBlocks = await n2m.blocksToMarkdown(bodyBlocks);
  const mdString = n2m.toMarkdownString(mdBlocks).parent || '';
  const content = mdToPortableText(mdString);

  // 슬러그 생성
  const titleForSlug = schemaData['title'] || schemaData['제목'] || '';
  const slug = titleForSlug
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 96);

  const doc = {
    _type: 'journal',
    title: schemaData['title'] || schemaData['제목'] || '',
    subtitle: schemaData['subtitle'] || schemaData['부제'] || '',
    category: schemaData['category'] || schemaData['카테고리'] || 'ESSAY',
    publishedAt: schemaData['publishedAt'] || schemaData['발행일'] || new Date().toISOString(),
    slug: { _type: 'slug', current: slug },
    playlistUrl: schemaData['playlistUrl'] || schemaData['플레이리스트'] || undefined,
    content,
  };

  // 빈값 제거
  Object.keys(doc).forEach((k) => {
    if (doc[k] === '' || doc[k] === undefined) delete doc[k];
  });

  // 기존 slug 확인 후 upsert
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

// ── SESSION 동기화 ─────────────────────────────────────────────────
async function syncSession(notionPageId) {
  console.log(`\nSession 파싱 중... (페이지 ID: ${notionPageId})`);
  const blocks = await getBlocks(notionPageId);

  // SCHEMA: Session 섹션 찾기
  let inSessionSection = false;
  const tables = [];

  for (const block of blocks) {
    if (block.type === 'heading_2') {
      const heading = richText(block.heading_2.rich_text);
      inSessionSection = heading.startsWith('SCHEMA: Session');
    }
    if (inSessionSection && block.type === 'table') {
      tables.push(block);
    }
  }

  if (tables.length === 0) {
    console.error('Session 테이블을 찾을 수 없습니다. 노션 페이지에 "## SCHEMA: Session" 섹션과 테이블이 있는지 확인해주세요.');
    process.exit(1);
  }

  console.log(`${tables.length}개 Session 테이블 발견.`);
  let successCount = 0;

  for (const table of tables) {
    const data = await parseTable(table);

    const name = data['name'] || data['이름'] || data['대회명'] || '';
    const dateRaw = data['date'] || data['날짜'] || data['개최일'] || '';
    const doc = {
      _type: 'session',
      name,
      date: dateRaw || undefined,
      type: data['type'] || data['유형'] || 'EVENT',
      location: data['location'] || data['장소'] || '',
      description: data['description'] || data['설명'] || '',
      registrationUrl: data['registrationUrl'] || data['접수링크'] || undefined,
      status: data['status'] || data['접수상태'] || '접수중',
    };

    // 빈값 제거
    Object.keys(doc).forEach((k) => {
      if (doc[k] === '' || doc[k] === undefined) delete doc[k];
    });

    if (!doc.name) {
      console.warn('  ⚠ name 없는 테이블 스킵');
      continue;
    }

    // 같은 이름+날짜 존재 시 patch
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
    successCount++;
  }

  console.log(`\n완료: ${successCount}/${tables.length} Session 처리됨`);
}

// ── 메인 ──────────────────────────────────────────────────────────
try {
  if (type === 'journal') {
    await syncJournal(pageId);
  } else if (type === 'session') {
    await syncSession(pageId);
  } else {
    console.error(`알 수 없는 type: "${type}". journal 또는 session을 사용해주세요.`);
    process.exit(1);
  }
  console.log('\n✅ 동기화 완료');
} catch (err) {
  console.error('\n❌ 오류 발생:', err.message);
  process.exit(1);
}
