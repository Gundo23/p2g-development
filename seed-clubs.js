// api/seed-clubs.js
// ONE TIME USE — visit this URL once in your browser to populate the clubs table:
// https://p2-g.vercel.app/api/seed-clubs?secret=p2gseed2026
// After seeding is complete you can delete this file.

import { createClient } from "@supabase/supabase-js";

const SECRET = "p2gseed2026";
const API_HOST = "uk-golf-course-data-api.p.rapidapi.com";

export default async function handler(req, res) {
  if (req.query.secret !== SECRET) {
    return res.status(401).json({ error: "Unauthorised" });
  }

  const API_KEY = process.env.UK_GOLF_API_KEY;
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const normalise = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();

  async function fetchPage(page) {
    const r = await fetch(
      `https://${API_HOST}/clubs?page=${page}&per_page=20`,
      {
        headers: {
          "X-RapidAPI-Key": API_KEY,
          "X-RapidAPI-Host": API_HOST,
          "Content-Type": "application/json",
        },
      }
    );
    if (!r.ok) throw new Error(`API error ${r.status} on page ${page}`);
    return r.json();
  }

  try {
    // Check how many clubs already seeded
    const { count: existing } = await supabase
      .from("clubs")
      .select("*", { count: "exact", head: true });

    // Get first page to find total
    const first = await fetchPage(1);
    const totalPages = first.total_pages || 134;
    const total = first.total || 2666;

    // If already fully seeded, skip
    if (existing >= total - 10) {
      return res.status(200).json({
        message: "Already seeded",
        clubs_in_db: existing,
        total,
      });
    }

    // Figure out which page to start from based on what's already seeded
    const startPage = Math.max(1, Math.floor((existing || 0) / 20));

    let seeded = 0;
    let errors = 0;

    // Vercel functions time out after 60s — process up to 30 pages per call
    const pagesToProcess = 30;
    const endPage = Math.min(startPage + pagesToProcess, totalPages);

    for (let page = startPage; page <= endPage; page++) {
      await new Promise((r) => setTimeout(r, 350)); // stay under rate limit

      try {
        const data = page === 1 ? first : await fetchPage(page);
        const clubs = (data.clubs || []).map((c) => ({
          id: c.id,
          name: c.name,
          city: c.city || null,
          county: c.county || null,
          postcode: c.postcode || null,
          country_code: c.country_code || null,
          normalised_name: normalise(c.name),
        }));

        const { error } = await supabase
          .from("clubs")
          .upsert(clubs, { onConflict: "id" });

        if (error) errors++;
        else seeded += clubs.length;
      } catch (e) {
        errors++;
      }
    }

    const { count: nowInDb } = await supabase
      .from("clubs")
      .select("*", { count: "exact", head: true });

    const done = nowInDb >= total - 10;

    return res.status(200).json({
      message: done
        ? "✅ Seeding complete!"
        : `⏳ Progress: ${nowInDb}/${total} clubs. Visit this URL again to continue.`,
      clubs_seeded_this_run: seeded,
      clubs_in_db: nowInDb,
      total,
      errors,
      done,
      next_action: done
        ? "Delete api/seed-clubs.js from GitHub — it is no longer needed."
        : "Visit the URL again to continue seeding.",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
