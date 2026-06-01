const COURSES = [
  "Leasowe Golf Club",
  "Wallasey Golf Club",
  "Royal Liverpool Golf Club",
  "Caldy Golf Club",
  "Prenton Golf Club"
];

export default async function handler(req, res) {
  const results = [];

  for (const name of COURSES) {
    try {
      const searchRes = await fetch(
        `https://uk-golf-course-data-api.p.rapidapi.com/clubs?search=${encodeURIComponent(name)}`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.UK_GOLF_API_KEY,
            "X-RapidAPI-Host": "uk-golf-course-data-api.p.rapidapi.com",
            "Content-Type": "application/json",
          },
        }
      );

      const searchData = await searchRes.json();
      const club = searchData.clubs?.[0];

      if (!club) {
        results.push({ name, found: false });
        continue;
      }

      const coursesRes = await fetch(
        `https://uk-golf-course-data-api.p.rapidapi.com/clubs/${club.id}/courses`,
        {
          headers: {
            "X-RapidAPI-Key": process.env.UK_GOLF_API_KEY,
            "X-RapidAPI-Host": "uk-golf-course-data-api.p.rapidapi.com",
            "Content-Type": "application/json",
          },
        }
      );

      const courses = await coursesRes.json();
      const course = courses?.[0];
      const yellowTee = course?.tee_sets?.find(
        (t) => String(t.name || t.colour || "").toLowerCase().includes("yellow")
      );

      results.push({
        name,
        found: true,
        clubId: club.id,
        courseId: course?.id || null,
        courseName: course?.name || null,
        yellowTee: !!yellowTee,
        hasStrokeIndex: !!yellowTee?.holes?.some((h) => h.stroke_index),
        holes: yellowTee?.holes?.length || 0,
      });
    } catch (err) {
      results.push({ name, error: err.message });
    }
  }

  res.status(200).json({ checked: results.length, results });
}
