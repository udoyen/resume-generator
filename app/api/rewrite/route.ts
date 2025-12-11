import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    // 1. Accept the new linkedinUrl parameter
    const { resumeText, jobDescription, linkedinUrl } = await req.json();

    const result = await generateObject({
      model: google("gemini-2.5-flash"), 
      schema: z.object({
        personalInfo: z.object({
          name: z.string().describe("Name extracted from resume"),
          email: z.string().describe("Email address"),
          phone: z.string().describe("Phone number"),
          linkedin: z.string().describe("The LinkedIn URL. If the user provided one explicitly, use that. Otherwise, extract from resume."),
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
      4. DO NOT invent false experience. Only reframe existing experience.
      5. CRITICAL: If the "USER PROVIDED LINKEDIN URL" is not empty, you MUST use it for the linkedin field, ignoring any conflicting URL in the resume text.`,
      prompt: `
        RESUME TEXT:
        ${resumeText}

        JOB DESCRIPTION:
        ${jobDescription}

        USER PROVIDED LINKEDIN URL:
        ${linkedinUrl || "Not provided, look in resume text."}
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