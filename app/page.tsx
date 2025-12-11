"use client";

import { useState, useEffect } from "react";
import { ResumeDocument } from "@/components/ResumeDocument";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx";
import { saveAs } from "file-saver";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState(""); // <--- New State for LinkedIn
  const [rewrittenResume, setRewrittenResume] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setExtractedText(""); 
      setRewrittenResume(null); 
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await response.json();
      if (data.text) setExtractedText(data.text);
    } catch (error) {
      console.error(error);
      alert("Error parsing file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!extractedText || !jobDescription) return;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass the linkedinUrl to the backend
        body: JSON.stringify({ 
          resumeText: extractedText, 
          jobDescription, 
          linkedinUrl 
        }),
      });

      const data = await response.json();
      setRewrittenResume(data);
    } catch (error) {
      console.error(error);
      alert("Error generating resume");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- PDF DOWNLOAD ---
  const downloadPdf = async () => {
    if (!rewrittenResume) return;
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(<ResumeDocument data={rewrittenResume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = rewrittenResume.personalInfo.name.replace(/\s+/g, '_') || "Resume";
      link.download = `Tailored_Resume_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate PDF.");
    }
  };

  // --- WORD / GOOGLE DOC DOWNLOAD ---
  const downloadWord = async () => {
    if (!rewrittenResume) return;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Name
            new Paragraph({
              text: rewrittenResume.personalInfo.name,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            // Contact Line with REAL Hyperlink
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun(rewrittenResume.personalInfo.email),
                new TextRun(" | "),
                // Create a real ExternalHyperlink for Word
                new ExternalHyperlink({
                  children: [
                    new TextRun({
                      text: "LinkedIn Profile",
                      style: "Hyperlink",
                      color: "0563C1",
                      underline: { type: "single" },
                    }),
                  ],
                  link: rewrittenResume.personalInfo.linkedin || "",
                }),
                new TextRun(" | "),
                new TextRun(rewrittenResume.personalInfo.phone),
              ],
            }),
            new Paragraph({ text: "" }),

            // Summary
            new Paragraph({
              text: "Professional Summary",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: rewrittenResume.summary,
            }),
            new Paragraph({ text: "" }),

            // Experience
            new Paragraph({
              text: "Experience",
              heading: HeadingLevel.HEADING_2,
            }),
            ...rewrittenResume.experience.flatMap((job: any) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${job.role} | ${job.company}`, bold: true }),
                  new TextRun({ text: `  (${job.duration})`, italics: true }),
                ],
                spacing: { before: 200 },
              }),
              ...job.description.map((point: string) => 
                new Paragraph({
                  text: point,
                  bullet: { level: 0 },
                })
              ),
            ]),
            new Paragraph({ text: "" }),

            // Skills
            new Paragraph({
              text: "Skills",
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              text: rewrittenResume.skills.join(", "),
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = rewrittenResume.personalInfo.name.replace(/\s+/g, '_') || "Resume";
    saveAs(blob, `Tailored_Resume_${safeName}.docx`);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-50">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-4xl font-bold text-center text-gray-800">AI Resume Builder</h1>

        {/* Step 1: Upload */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold">1. Upload your Current Resume</h2>
          <div className="flex gap-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              onClick={handleUpload}
              disabled={!file || isLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Parsing..." : "Parse PDF"}
            </button>
          </div>
        </div>

        {/* Step 2: Job Description & LinkedIn */}
        {extractedText && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold">2. Enter Details</h2>
            
            {/* New LinkedIn Input */}
            <div className="space-y-2">
               <label className="text-sm font-medium text-gray-700">LinkedIn Profile URL (Optional)</label>
               <input
                type="text"
                placeholder="e.g. https://www.linkedin.com/in/yourname"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Job Description</label>
              <textarea
                className="w-full h-40 p-3 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
                placeholder="Paste the JD here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            
            <button
              onClick={handleGenerate}
              disabled={!jobDescription || isGenerating}
              className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700 disabled:bg-gray-400"
            >
              {isGenerating ? "Generating Tailored Resume..." : "Generate Tailored Resume"}
            </button>
          </div>
        )}

        {/* Step 3: Result & Download */}
        {rewrittenResume && isClient && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4 border-2 border-green-100">
            <h2 className="text-xl font-semibold text-green-800">3. Your Tailored Resume</h2>
            
            <div className="flex justify-center gap-4 py-4">
              <button
                onClick={downloadPdf}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg transition-transform hover:scale-105"
              >
                Download PDF
              </button>
              
              <button
                onClick={downloadWord}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 shadow-lg transition-transform hover:scale-105"
              >
                Download Word / Google Doc
              </button>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer text-gray-500 text-sm">View Raw JSON</summary>
              <div className="p-4 bg-gray-50 rounded h-40 overflow-y-auto font-mono text-xs mt-2">
                {JSON.stringify(rewrittenResume, null, 2)}
              </div>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}