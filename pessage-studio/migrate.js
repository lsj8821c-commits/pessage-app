/**
 * Sanity 문서 타입 마이그레이션
 *
 * course  → route
 * race    → session
 *
 * 사용법:
 *   npx sanity exec migrate.js --with-user-token              # dry-run
 *   npx sanity exec migrate.js --with-user-token -- --execute # 실제 실행
 */

import {getCliClient} from 'sanity/cli'

const DRY_RUN = !process.argv.includes('--execute')

const client = getCliClient({apiVersion: '2024-01-01'})

const TYPE_MAP = {
  course: 'route',
  race: 'session',
}

async function fetchAllByType(type) {
  const all = []
  let lastId = ''

  while (true) {
    const query = lastId
      ? `*[_type == $type && _id > $lastId] | order(_id asc) [0...1000]`
      : `*[_type == $type] | order(_id asc) [0...1000]`

    const params = lastId ? {type, lastId} : {type}
    const batch = await client.fetch(query, params)

    all.push(...batch)
    if (batch.length < 1000) break
    lastId = batch[batch.length - 1]._id
  }

  return all
}

async function migrateType(oldType, newType) {
  console.log(`\n[${oldType} → ${newType}] 문서 조회 중...`)
  const docs = await fetchAllByType(oldType)

  if (docs.length === 0) {
    console.log(`  → '${oldType}' 문서 없음. 건너뜁니다.`)
    return
  }

  console.log(`  → ${docs.length}건 발견`)

  if (DRY_RUN) {
    docs.forEach((doc) => {
      console.log(`  [DRY-RUN] ${doc._id}  (${oldType} → ${newType})`)
    })
    return
  }

  // _type은 immutable이므로 별도 트랜잭션으로 delete → create 처리
  const BATCH_SIZE = 50
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE)

    // 1단계: 삭제
    const deleteTx = client.transaction()
    for (const doc of batch) {
      deleteTx.delete(doc._id)
    }
    await deleteTx.commit()

    // 2단계: 새 타입으로 생성
    const createTx = client.transaction()
    for (const doc of batch) {
      const {_rev, ...rest} = doc
      createTx.create({...rest, _type: newType})
    }
    await createTx.commit()

    console.log(`  → ${i + batch.length}/${docs.length} 완료`)
  }

  console.log(`  ✓ '${oldType}' → '${newType}' 마이그레이션 완료`)
}

async function main() {
  console.log('=== Pessage Sanity 타입 마이그레이션 ===')
  console.log(DRY_RUN ? '모드: DRY-RUN (실제 변경 없음)' : '모드: EXECUTE (실제 변경)')

  for (const [oldType, newType] of Object.entries(TYPE_MAP)) {
    await migrateType(oldType, newType)
  }

  if (DRY_RUN) {
    console.log('\n---')
    console.log('실제 마이그레이션을 실행하려면:')
    console.log('  npx sanity exec migrate.js --with-user-token -- --execute')
  } else {
    console.log('\n=== 마이그레이션 완료 ===')
  }
}

main().catch((err) => {
  console.error('마이그레이션 실패:', err.message)
  process.exit(1)
})
