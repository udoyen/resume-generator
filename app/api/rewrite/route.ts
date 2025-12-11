import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription } = await req.json();

    const result = await generateObject({
      model: google("gemini-2.5-flash"), // Switching to Google Gemini
      schema: z.object({
        personalInfo: z.object({
          name: z.string().describe("Name extracted from resume"),
          contact: z.string().describe("Contact info extracted from resume"),
        }),
        summary: z.string().describe("A professional summary tailored to the job description."),
        experience: z.array(
          z.object({
            company: z.string(),
            role: z.string(),
            duration: z.string(),
            description: z.array(z.string()).describe("Bullet points optimized for the job keywords"),
          })
        ),
        skills: z.array(z.string()).describe("List of technical skills matching the job description"),
      }),
      system: `You are an expert resume writer. 
      1. Analyze the candidate's existing resume and the target job description. 
      2. Rewrite the resume to highlight experience relevant to the job. 
      3. Use keywords from the job description naturally. 
      4. DO NOT invent false experience. Only reframe existing experience.`,
      prompt: `
        RESUME TEXT:
        ${resumeText}

        JOB DESCRIPTION:
        ${jobDescription}
      `,
    });

    return result.toJsonResponse();
  } catch (error) {
    console.error("AI Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate resume" }), {
      status: 500,
    });
  }
}