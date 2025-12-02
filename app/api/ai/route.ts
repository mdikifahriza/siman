// app/api/ai/route.ts
import { NextRequest, NextResponse } from "next/server";

const AIMLAPI_URL = "https://api.aimlapi.com/v1/chat/completions";  // atau endpoint yang sesuai document
const AIMLAPI_KEY = process.env.AIMLAPI_KEY;

if (!AIMLAPI_KEY) {
  console.error("Missing AIMLAPI_KEY");
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const message = (formData.get("message") as string) || "";
  const file = formData.get("image") as File | null;

  // optional: handle image upload to base64
  let imagePayload: any = null;
  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    imagePayload = {
      type: "image_base64",
      data: base64,
      mime: file.type || "image/jpeg",
    };
  }

  const body: any = {
    model: "gpt-4o",             // atau model yang tersedia di AIMLAPI
    messages: [
      { role: "system", content: "You are an agronomy assistant in Bahasa Indonesia." },
      ...(imagePayload ? [{ role: "user", content: `Here is an image: ${JSON.stringify(imagePayload)}` }] : []),
      { role: "user", content: message },
    ],
    // opsional: parameter lainnya sesuai dokumentasi
  };

  const resp = await fetch(AIMLAPI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${AIMLAPI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: "API call failed", details: text }, { status: 502 });
  }

  const data = await resp.json();
  const answer = data.choices?.[0]?.message?.content || "Maaf, tidak ada respons.";

  return NextResponse.json({ result: answer });
}
