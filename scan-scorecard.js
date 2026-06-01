export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed",
    });
  }

  try {
    const { image, tee } = req.body;

    if (!image) {
      return res.status(400).json({
        message: "No image supplied",
      });
    }

    // Temporary stub so the upload button works

    return res.status(200).json({
      course_name: "Uploaded Scorecard",
      tee: tee || "Yellow",
      par: 72,
      course_rating: 72.0,
      slope_rating: 125,
      holes: [],
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
}
