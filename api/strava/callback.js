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

    // 2. 최근 러닝 활동 조회 (최대 10개)
    const activitiesRes = await fetch(
      'https://www.strava.com/api/v3/athlete/activities?per_page=10',
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const activities = await activitiesRes.json();
    const runs = Array.isArray(activities)
      ? activities.filter(a => a.type === 'Run' || a.sport_type === 'Run')
      : [];
    const lastRunSummary = runs[0] || null;

    // 3. 마지막 러닝 상세 조회 (칼로리 포함)
    let lastRun = null;
    if (lastRunSummary) {
      const detailRes = await fetch(
        `https://www.strava.com/api/v3/activities/${lastRunSummary.id}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      );
      const detail = await detailRes.json();
      const distKm = lastRunSummary.distance / 1000;
      const paceSecsPerKm = distKm > 0
        ? Math.round(lastRunSummary.moving_time / distKm)
        : null;

      lastRun = {
        id: lastRunSummary.id,
        name: lastRunSummary.name,
        distance: lastRunSummary.distance,
        moving_time: lastRunSummary.moving_time,
        paceSecsPerKm,
        average_heartrate: lastRunSummary.average_heartrate || null,
        max_heartrate: lastRunSummary.max_heartrate || null,
        calories: detail.calories || null,
        start_date: lastRunSummary.start_date,
      };
    }

    // 4. 이번 주 (월요일 00:00 이후) 활동 조회
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - daysToMonday);
    const weekStartTs = Math.floor(weekStart.getTime() / 1000);

    const weekRes = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?after=${weekStartTs}&per_page=50`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    const weekActivities = await weekRes.json();
    const weekRuns = Array.isArray(weekActivities)
      ? weekActivities.filter(a => a.type === 'Run' || a.sport_type === 'Run')
      : [];

    return res.status(200).json({
      id: String(athlete.id),
      name: `${athlete.firstname} ${athlete.lastname}`.trim(),
      photo: athlete.profile_medium || athlete.profile || null,
      lastRun,
      weeklyStats: {
        distanceM: weekRuns.reduce((sum, a) => sum + a.distance, 0),
        count: weekRuns.length,
      },
      recentRuns: runs.slice(0, 5).map(a => {
        const dk = a.distance / 1000;
        return {
          name: a.name,
          distance: a.distance,
          moving_time: a.moving_time,
          paceSecsPerKm: dk > 0 ? Math.round(a.moving_time / dk) : null,
          average_heartrate: a.average_heartrate || null,
          start_date: a.start_date,
        };
      }),
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
}
