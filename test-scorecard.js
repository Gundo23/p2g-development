test-scorecard_IMPROVEMENTS.txt

Apply these changes to api/test-scorecard.js

1) Replace the matchScore() function with:

function matchScore(a, b) {
  const na = normalise(a);
  const nb = normalise(b);

  const sa = stripSuffixes(a);
  const sb = stripSuffixes(b);

  if (na === nb) return 100;
  if (sa === sb) return 95;

  if (na.includes(nb) || nb.includes(na)) return 90;
  if (sa.includes(sb) || sb.includes(sa)) return 85;

  const at = sa.split(" ").filter(Boolean);
  const bt = sb.split(" ").filter(Boolean);

  const shared = at.filter(t => bt.includes(t)).length;

  if (shared >= 2) return 75;
  if (shared === 1) return 50;

  return 0;
}

2) Replace the first-word search block with:

if (!rows?.length) {
  const words = strippedSearch.split(" ").filter(Boolean);

  for (const word of words) {
    if (word.length < 4) continue;

    ({ data: rows } = await supabase
      .from("clubs")
      .select("id, name, normalised_name")
      .ilike("normalised_name", `%${word}%`)
      .limit(30));

    if (rows?.length) break;
  }
}

if (!rows?.length) {
  ({ data: rows } = await supabase
    .from("clubs")
    .select("id, name, normalised_name")
    .limit(500));
}

3) Change:

return scored[0]?.score >= 40 ? scored[0] : null;

to:

return scored[0]?.score >= 25 ? scored[0] : null;

These changes improve matching for:
- Eastham Lodge
- Prenton
- Upton-by-Chester
- Vicars Cross
- North Wales
