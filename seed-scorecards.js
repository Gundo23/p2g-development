// api/seed-scorecards.js
// Visit once to bulk-fetch and cache all course scorecards:
// https://p2-g.vercel.app/api/seed-scorecards?secret=p2gseed2026
// Visit multiple times — it skips already-cached courses and retries failures.

import { createClient } from "@supabase/supabase-js";

const SECRET = "p2gseed2026";
const API_HOST = "uk-golf-course-data-api.p.rapidapi.com";

const COURSES = [
  "Alwoodley Golf Club",
  "Ashton-under-Lyne Golf Club",
  "Astbury Golf Club",
  "Beeston Fields Golf Club",
  "Blackpool North Shore Golf Club",
  "Bolton Old Links Golf Club",
  "Bradford Golf Club",
  "Bromborough Golf Club",
  "Caldy Golf Club",
  "Carlisle Golf Club",
  "Chester Golf Club",
  "Chorlton-cum-Hardy Golf Club",
  "Conwy Golf Club",
  "Coxmoor Golf Club",
  "Dean Wood Golf Club",
  "Delamere Forest Golf Club",
  "Dewsbury District Golf Club",
  "Didsbury Golf Club",
  "Dore & Totley Golf Club",
  "Eaton Golf Club",
  "Ellesmere Port Golf Club",
  "Fairhaven Golf Club",
  "Fleetwood Golf Club",
  "Formby Golf Club",
  "Formby Ladies Golf Club",
  "Fulford Golf Club",
  "Ganton Golf Club",
  "Halifax Bradley Hall Golf Club",
  "Hallamshire Golf Club",
  "Harrogate Golf Club",
  "Hawarden Golf Club",
  "Headingley Golf Club",
  "Hesketh Golf Club",
  "Holywell Golf Club",
  "Huddersfield Golf Club",
  "Ilkley Golf Club",
  "Keighley Golf Club",
  "Lancaster Golf Club",
  "Leasowe Golf Club",
  "Leeds Golf Club",
  "Lightcliffe Golf Club",
  "Lindrick Golf Club",
  "Lymm Golf Club",
  "Maesdu Golf Club",
  "Manchester Golf Club",
  "Meltham Golf Club",
  "Mold Golf Club",
  "Moor Allerton Golf Club",
  "Moortown Golf Club",
  "Morecambe Golf Club",
  "North Wales Golf Club",
  "Northenden Golf Club",
  "Old Padeswood Golf Club",
  "Otley Golf Club",
  "Pannal Golf Club",
  "Pennant Park Golf Club",
  "Penrith Golf Club",
  "Prestatyn Golf Club",
  "Prestbury Golf Club",
  "Prenton Golf Club",
  "Rhuddlan Golf Club",
  "Rotherham Golf Club",
  "Royal Liverpool Golf Club",
  "Rudding Park Golf Club",
  "Saddleworth Golf Club",
  "Sand Moor Golf Club",
  "Sandiway Golf Club",
  "Sherwood Forest Golf Club",
  "Silloth on Solway Golf Club",
  "Skipton Golf Club",
  "Southport & Ainsdale Golf Club",
  "Stockport Golf Club",
  "Upton-by-Chester Golf Club",
  "Vicars Cross Golf Club",
  "Wakefield Golf Club",
  "Wallasey Golf Club",
  "Warrington Golf Club",
  "West Lancashire Golf Club",
  "Wilmslow Golf Club",
  "Withington Golf Club",
  "Workington Golf Club",
  "Worsley Golf Club",
];

const TEE = "Yellow";

export default async function handler(req, res) {
  if (req.query.secret !== SECRET) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const API_KEY = process.env.UK_GOLF_API_KEY;
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const normalise = (v) =>
    String(v || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

  const stripSuffixes = (name) =>
    normalise(name)
      .replace(/\bgolf club\b/g, "").replace(/\bgolf course\b/g, "")
      .replace(/\bgolf\b/g, "").replace(/\bclub\b/g, "")
      .replace(/\bcourse\b/g, "").replace(/\bresort\b/g, "")
      .replace(/\bthe\b/g, "").replace(/\s+/g, " ").trim();

  function matchScore(a, b) {
    const na = normalise(a), nb = normalise(b);
    const sa = stripSuffixes(a), sb = stripSuffixes(b);
    if (na === nb) return 100;
    if (sa === sb) return 90;
    if (na.includes(sb) || nb.includes(sa)) return 80;
    if (sa.includes(sb) || sb.includes(sa)) return 70;
    const at = sa.split(" ").filter(Boolean);
    const bt = sb.split(" ").filter(Boolean);
    const shared = at.filter(t => bt.includes(t)).length;
    const total = Math.max(at.length, bt.length);
    return total > 0 ? Math.round((shared / total) * 60) : 0;
  }

  async function apiFetch(path) {
    const r = await fetch(`https://${API_HOST}${path}`, {
      headers: {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": API_HOST,
        "Content-Type": "application/json",
      },
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data?.message || `API ${r.status}`);
    return data;
  }

  async function findClub(courseName) {
    const norm = normalise(courseName);
    const stripped = stripSuffixes(courseName);

    let { data: rows } = await supabase
      .from("clubs").select("id, name, normalised_name")
      .eq("normalised_name", norm).limit(5);

    if (!rows?.length) {
      ({ data: rows } = await supabase
        .from("clubs").select("id, name, normalised_name")
        .ilike("normalised_name", `%${stripped}%`).limit(10));
    }

    if (!rows?.length) return null;
    const scored = rows.map(r => ({ ...r, score: matchScore(r.name, courseName) }))
      .sort((a, b) => b.score - a.score);
    return scored[0]?.score >= 40 ? scored[0] : null;
  }

  async function fetchScorecard(courseName) {
    const club = await findClub(courseName);
    if (!club?.id) throw new Error(`Club not found in Supabase`);

    const coursesResponse = await apiFetch(`/clubs/${club.id}/courses`);
    const courseList = Array.isArray(coursesResponse) ? coursesResponse : coursesResponse?.courses || [];

    const matchedCourse = courseList
      .map(c => ({ ...c, score: matchScore(c.name, courseName) }))
      .sort((a, b) => b.score - a.score || (b.tee_sets?.length || 0) - (a.tee_sets?.length || 0))[0];

    if (!matchedCourse?.id) throw new Error(`No course under club "${club.name}"`);

    const teeSets = matchedCourse?.tee_sets || courseList.flatMap(c => c.tee_sets || []);
    const normTee = normalise(TEE);
    const TEE_FALLBACK = ["yellow", "white", "cream", "silver", "blue", "green", "red"];

    let matchedTee =
      teeSets.find(t => normalise(t.name) === normTee && normalise(t.colour) === normTee) ||
      teeSets.find(t => normalise(t.name) === normTee) ||
      teeSets.find(t => normalise(t.colour) === normTee && t.name) ||
      teeSets.find(t => normalise(t.colour) === normTee);

    if (!matchedTee?.id) {
      for (const fc of TEE_FALLBACK) {
        if (fc === normTee) continue;
        matchedTee =
          teeSets.find(t => normalise(t.name) === fc && normalise(t.colour) === fc) ||
          teeSets.find(t => normalise(t.name) === fc) ||
          teeSets.find(t => normalise(t.colour) === fc);
        if (matchedTee?.id) break;
      }
    }

    if (!matchedTee?.id && teeSets.length > 0) matchedTee = teeSets.find(t => t.name) || teeSets[0];
    if (!matchedTee?.id) throw new Error(`No tee sets found`);

    const scorecard = await apiFetch(`/courses/${matchedTee.id}/scorecard`);
    const holes = scorecard?.tee_set?.holes || scorecard?.teeSet?.holes || scorecard?.holes || [];

    if (!Array.isArray(holes) || holes.length !== 18) {
      throw new Error(`Got ${holes.length} holes (need 18)`);
    }

    return {
      course_id: matchedCourse.id,
      course_name: courseName,
      tee_set: {
        ...matchedTee,
        ...(scorecard?.tee_set || scorecard?.teeSet || {}),
        colour: matchedTee.colour || TEE.toLowerCase(),
        holes,
      },
    };
  }

  try {
    // Check which courses already cached
    const { data: cached } = await supabase
      .from("scorecard_cache").select("course_name");
    const cachedNames = new Set((cached || []).map(r => normalise(r.course_name)));

    const toProcess = COURSES.filter(c => !cachedNames.has(normalise(c)));

    if (toProcess.length === 0) {
      return res.status(200).json({
        message: "✅ All courses already cached!",
        total: COURSES.length,
        cached: cachedNames.size,
      });
    }

    // Process up to 10 per call to stay within Vercel timeout + rate limits
    const batch = toProcess.slice(0, 10);
    const results = { success: [], failed: [] };

    for (const courseName of batch) {
      await new Promise(r => setTimeout(r, 500)); // rate limit buffer
      try {
        const scorecard = await fetchScorecard(courseName);
        const cacheId = `${normalise(courseName)}__${normalise(TEE)}`;
        await supabase.from("scorecard_cache").upsert({
          id: cacheId,
          course_name: courseName,
          tee: TEE,
          data: scorecard,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });
        results.success.push(courseName);
      } catch (err) {
        results.failed.push({ course: courseName, reason: err.message });
      }
    }

    const remaining = toProcess.length - batch.length;

    return res.status(200).json({
      message: remaining > 0
        ? `⏳ ${results.success.length} cached this run. ${remaining} remaining — visit again to continue.`
        : `✅ Seeding complete! ${results.success.length} cached this run.`,
      success_this_run: results.success,
      failed_this_run: results.failed,
      remaining,
      total_cached_so_far: cachedNames.size + results.success.length,
      total: COURSES.length,
      next_action: remaining > 0 ? "Visit the URL again to continue." : "All done!",
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
