"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ResumeDocument } from "@/components/ResumeDocument";

// Fix for React-PDF in Next.js: Dynamically import the PDFDownloadLink
const PDFDownloadLink = dynamic(
  () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
  {
    ssr: false,
    loading: () => <p>Loading download button...</p>,
  }
);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [rewrittenResume, setRewrittenResume] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ... (keep your handleFileChange, handleUpload, handleGenerate functions exactly as they were) ...
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
        body: JSON.stringify({ resumeText: extractedText, jobDescription }),
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

        {/* Step 2: Job Description */}
        {extractedText && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-semibold">2. Paste the Job Description</h2>
            <textarea
              className="w-full h-40 p-3 border rounded focus:ring-2 focus:ring-blue-500 text-gray-700"
              placeholder="Paste the JD here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
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
        {rewrittenResume && (
          <div className="bg-white p-6 rounded-lg shadow space-y-4 border-2 border-green-100">
            <h2 className="text-xl font-semibold text-green-800">3. Your Tailored Resume</h2>
            
            <div className="flex justify-center py-4">
              <PDFDownloadLink
                document={<ResumeDocument data={rewrittenResume} />}
                fileName={`Tailored_Resume.pdf`}
                className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-700 shadow-lg transition-transform hover:scale-105"
              >
                {/*@ts-ignore*/}
                {({ loading }) => (loading ? "Preparing PDF..." : "Download PDF Now")}
              </PDFDownloadLink>
            </div>

            {/* Optional: Keep the JSON view for debugging if you want */}
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