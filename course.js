export default async function handler(req, res) {
  const { id } = req.query;

  try {
    const response = await fetch(
      `https://api.golfcourseapi.com/v1/courses/${id}`,
      {
        headers: {
          Authorization: `Key ${process.env.GOLF_COURSE_API_KEY}`,
        },
      }
    );

    const data = await response.json();

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({
      error: err.message,
    });
  }
}
