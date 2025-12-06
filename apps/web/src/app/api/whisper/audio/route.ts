import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: "`file` is required." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is missing" },
        { status: 400 }
      );
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const transcription = await groq.audio.transcriptions.create({
      file,
      model: "distil-whisper-large-v3-en",
      language: "en",
      temperature: 0.0,
    });

    return NextResponse.json(
      { success: true, text: transcription.text },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to process transcription request:", error);

    return NextResponse.json(
      { error: "Failed to transcribe audio: " + error.message },
      { status: 500 }
    );
  }
}
