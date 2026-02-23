export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    // 1. code → access_token 교환 (응답에 athlete 포함)
    const tokenRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.VITE_STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'Failed to get access token', detail: tokenData });
    }

    const { access_token, athlete } = tokenData;

    // 2. 최근 러닝 활동 조회 (최대 10개, Run 필터)
    const activitiesRes = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=10',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const activities = await activitiesRes.json();
    const runs = Array.isArray(activities)
      ? activities.filter(a => a.type === 'Run' || a.sport_type === 'Run')
      : [];
    const lastRun = runs[0] || null;

    // 3. 연간 통계 조회
    const statsRes = await fetch(
      `https://www.strava.com/api/v3/athletes/${athlete.id}/stats`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const stats = await statsRes.json();

    return res.status(200).json({
      id: String(athlete.id),
      name: `${athlete.firstname} ${athlete.lastname}`.trim(),
      photo: athlete.profile_medium || athlete.profile || null,
      lastRun: lastRun
        ? {
            name: lastRun.name,
            distance: lastRun.distance,
            moving_time: lastRun.moving_time,
            average_heartrate: lastRun.average_heartrate || null,
            max_heartrate: lastRun.max_heartrate || null,
            start_date: lastRun.start_date,
          }
        : null,
      ytdDistanceM: stats.ytd_run_totals?.distance || 0,
      recentRuns: runs.slice(0, 5).map(a => ({
        name: a.name,
        distance: a.distance,
        moving_time: a.moving_time,
        average_heartrate: a.average_heartrate || null,
        start_date: a.start_date,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
