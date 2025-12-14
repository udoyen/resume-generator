import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { resumeText, jobDescription } = await req.json();

  const systemPrompt = `
    You are a professional candidate applying for a job. 
    Your goal is to write a cover letter that sounds AUTHENTIC, CONFIDENT, and HUMAN.
    
    STRICT RULES TO SOUND HUMAN:
    1. DO NOT use robot words: "thrilled", "esteemed", "delve", "showcase", "tapestry", "unwavering".
    2. DO NOT start with "I am writing to apply..." or "I hope this finds you well." Start with a hook about why you respect the company or a relevant achievement.
    3. Keep it punchy. Short paragraphs. No walls of text.
    4. Focus on specific problems you solved in your history that relate to this specific Job Description.
    5. Tone: Professional but conversational. Not stiff/academic.

    STRUCTURE:
    - Opening: A strong hook connecting your background to their mission.
    - Body Paragraph 1: One specific "Hero Story" from the resume that proves you can do the main task in the Job Description.
    - Body Paragraph 2: Briefly mention technical alignment.
    - Closing: Confident call to action.
  `;

  const userPrompt = `
    RESUME: 
    ${resumeText ? resumeText.substring(0, 5000) : "No resume text provided."}

    JOB DESCRIPTION: 
    ${jobDescription ? jobDescription.substring(0, 3000) : "No job description provided."}

    Write the cover letter now.
  `;

  try {
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: userPrompt,
    });

    // FIXED: Using toTextStreamResponse() based on your installed version
    return result.toTextStreamResponse();
    
  } catch (error) {
    console.error("Cover Letter Error:", error);
    return new Response("Error generating cover letter", { status: 500 });
  }
}