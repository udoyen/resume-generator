import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { resumeText, jobDescription, linkedinUrl, customInstructions } = await req.json();

    const result = await generateObject({
      model: google("gemini-2.5-flash"), 
      schema: z.object({
        personalInfo: z.object({
          name: z.string().describe("Name extracted from resume"),
          email: z.string().describe("Email address"),
          phone: z.string().describe("Phone number"),
          linkedin: z.string().describe("The LinkedIn URL."),
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
        education: z.array(
          z.object({
            institution: z.string(),
            degree: z.string(),
            year: z.string(),
          })
        ).describe("Educational qualifications"),
        projects: z.array(
          z.object({
            name: z.string(),
            role: z.string().describe("Your specific role in this project"), 
            duration: z.string().describe("Duration of the project"), 
            description: z.array(z.string()).describe("Bullet points starting with strong ACTION VERBS."), 
            link: z.string().optional().describe("Project URL if available"),
          })
        ).describe("Key projects"),
        // --- UPDATED: Certifications (No Year) ---
        certifications: z.array(
          z.object({
            name: z.string(),
            issuer: z.string(),
            // Year removed
          })
        ).describe("Relevant certifications and training"),
        // -----------------------------------------
        skills: z.array(z.string()).describe("List of technical skills matching the job description"),
      }),
      system: `You are an expert resume writer. 
      1. Analyze the candidate's existing resume and the target job description. 
      2. Rewrite the resume to highlight experience relevant to the job. 
      3. Use keywords from the job description naturally. 
      4. For Projects, extract the Role and Duration explicitly.
      5. CRITICAL: Follow the "USER INSTRUCTIONS" strictly.`,
      prompt: `
        RESUME TEXT:
        ${resumeText}

        JOB DESCRIPTION:
        ${jobDescription}

        USER PROVIDED LINKEDIN URL:
        ${linkedinUrl || "Not provided, look in resume text."}

        USER INSTRUCTIONS:
        ${customInstructions || "None provided."}
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