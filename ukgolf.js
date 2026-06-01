export default async function handler(req, res) {
  const { path = "regions", query = "" } = req.query;

  try {
    const endpoint = `https://uk-golf-course-data-api.p.rapidapi.com/${path}${query}`;

    const response = await fetch(endpoint, {
      headers: {
        "X-RapidAPI-Key": process.env.UK_GOLF_API_KEY,
        "X-RapidAPI-Host": "uk-golf-course-data-api.p.rapidapi.com",
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}
