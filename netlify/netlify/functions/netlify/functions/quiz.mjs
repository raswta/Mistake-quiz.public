export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const { items } = await req.json();
  if (!Array.isArray(items) || !items.length) return Response.json({ error: "No items" }, { status: 400 });

  const list = items.slice(0, 30).map((it, i) =>
    `${i + 1}. [${it.type}] ${String(it.text).slice(0, 500)}` +
    (it.note ? ` | Correct answer / explanation: ${String(it.note).slice(0, 500)}` : "")
  ).join("\n");

  const prompt = `A student saved these English-learning mistakes (questions they got wrong, or notes/rules they got wrong):

${list}

Create a multiple-choice quiz that tests exactly these points, one question per item (you may add a second question for items that cover big rules). Each question has 4 options and exactly one correct answer. Wrong options should be plausible. Keep the language simple.
Return ONLY valid JSON, no markdown:
{"questions":[{"q":"...","options":["A","B","C","D"],"answer":0,"explanation":"short explanation"}]}
"answer" is the index (0-3) of the correct option. Shuffle the position of correct answers.`;

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-5-5",
      max_tokens: 6000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!r.ok) return Response.json({ error: "AI request failed" }, { status: 502 });
  const data = await r.json();
  const text = data.content.map((c) => c.text || "").join("");
  try {
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return Response.json(json);
  } catch {
    return Response.json({ error: "Could not read AI response. Try again." }, { status: 502 });
  }
};

export const config = { path: "/api/quiz" };
