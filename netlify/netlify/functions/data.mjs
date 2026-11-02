import { getStore } from "@netlify/blobs";

export default async (req) => {
  const u = (new URL(req.url).searchParams.get("u") || "").toLowerCase().trim();
  if (!/^[a-z0-9_-]{3,30}$/.test(u)) return Response.json({ error: "Invalid username" }, { status: 400 });
  const store = getStore("users");
  if (req.method === "GET") {
    return Response.json((await store.get(u, { type: "json" })) || { folders: [] });
  }
  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > 400000) return Response.json({ error: "Too much data" }, { status: 413 });
    const body = JSON.parse(text);
    if (!Array.isArray(body.folders)) return Response.json({ error: "Bad data" }, { status: 400 });
    await store.setJSON(u, { folders: body.folders });
    return Response.json({ ok: true });
  }
  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/data" };
