"use client";

import { useState, useEffect } from "react";
import { ResumeDocument } from "@/components/ResumeDocument";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx";
import { saveAs } from "file-saver";
import { 
  Upload, FileText, PenTool, Briefcase, Copy, Check, 
  Loader2, Sparkles, Download, Linkedin, Settings, RefreshCw 
} from "lucide-react";

export default function Home() {
  // --- STATE MANAGEMENT ---
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  
  // Output States
  const [rewrittenResume, setRewrittenResume] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  
  // UI States
  const [activeTab, setActiveTab] = useState<"resume" | "letter">("resume");
  const [isLoading, setIsLoading] = useState(false); // Parsing loading state
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- HANDLERS ---

  const handleStartOver = () => {
    setFile(null);
    setExtractedText("");
    setJobDescription("");
    setLinkedinUrl("");
    setCustomInstructions("");
    setRewrittenResume(null);
    setCoverLetter("");
    setResetKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 1. Handle PDF Upload & Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setRewrittenResume(null); // Reset previous result

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (data.text) setExtractedText(data.text);
    } catch (error) {
      console.error("Error parsing PDF:", error);
      alert("Failed to parse PDF. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Generate Resume
  const handleGenerateResume = async () => {
    if (!extractedText || !jobDescription) return;

    setIsGeneratingResume(true);
    setActiveTab("resume");

    try {
      const response = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          resumeText: extractedText, 
          jobDescription, 
          linkedinUrl,
          customInstructions
        }),
      });

      const data = await response.json();
      setRewrittenResume(data);
    } catch (error) {
      console.error("Error generating resume:", error);
      alert("Error generating resume");
    } finally {
      setIsGeneratingResume(false);
    }
  };

  // 3. Generate Cover Letter (Streaming)
  const handleGenerateCoverLetter = async () => {
    if (!extractedText || !jobDescription) return;

    setIsGeneratingLetter(true);
    setCoverLetter(""); // Clear previous
    setActiveTab("letter");

    try {
      const response = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: extractedText, jobDescription }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        setCoverLetter((prev) => prev + chunkValue);
      }
    } catch (error) {
      console.error("Error generating cover letter:", error);
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  // 4. Download Resume PDF
  const downloadPdf = async () => {
    if (!rewrittenResume) return;
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(<ResumeDocument data={rewrittenResume} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const safeName = rewrittenResume.personalInfo?.name?.replace(/\s+/g, '_') || "Resume";
      link.download = `Tailored_Resume_${safeName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("PDF Generation failed:", error);
      alert("Failed to generate PDF.");
    }
  };

  // 5. Download Resume Word
  const downloadWord = async () => {
    if (!rewrittenResume) return;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: rewrittenResume.personalInfo.name,
              heading: HeadingLevel.TITLE,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun(rewrittenResume.personalInfo.email),
                new TextRun(" | "),
                new ExternalHyperlink({
                  children: [new TextRun({ text: "LinkedIn Profile", style: "Hyperlink", color: "0563C1", underline: { type: "single" } })],
                  link: rewrittenResume.personalInfo.linkedin || "",
                }),
                new TextRun(" | "),
                new TextRun(rewrittenResume.personalInfo.phone),
              ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Professional Summary", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: rewrittenResume.summary }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Experience", heading: HeadingLevel.HEADING_2 }),
            ...rewrittenResume.experience.flatMap((job: any) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${job.role} | ${job.company}`, bold: true }),
                  new TextRun({ text: `  (${job.duration})`, italics: true }),
                ],
                spacing: { before: 200 },
              }),
              ...job.description.map((point: string) => new Paragraph({ text: point, bullet: { level: 0 } })),
            ]),
            new Paragraph({ text: "" }),
            ...(rewrittenResume.projects?.length ? [
              new Paragraph({ text: "Key Projects", heading: HeadingLevel.HEADING_2 }),
              ...rewrittenResume.projects.flatMap((proj: any) => [
                new Paragraph({
                  children: [
                    new TextRun({ text: `${proj.name} | ${proj.role} | ${proj.duration}`, bold: true }),
                    proj.link ? new TextRun({ text: ` [Link]`, color: "0563C1" }) : new TextRun(""),
                  ],
                  spacing: { before: 100 },
                }),
                ...proj.description.map((point: string) => new Paragraph({ text: point, bullet: { level: 0 } }))
              ]),
              new Paragraph({ text: "" }),
            ] : []),
            new Paragraph({ text: "Education", heading: HeadingLevel.HEADING_2 }),
            ...(rewrittenResume.education || []).map((edu: any) => 
              new Paragraph({ children: [new TextRun({ text: edu.institution, bold: true }), new TextRun(` - ${edu.degree} (${edu.year})`)], bullet: { level: 0 } })
            ),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "Skills", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: rewrittenResume.skills.join(", ") }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const safeName = rewrittenResume.personalInfo.name.replace(/\s+/g, '_') || "Resume";
    saveAs(blob, `Tailored_Resume_${safeName}.docx`);
  };

  // 6. Download Cover Letter Word
  const downloadCoverLetter = async () => {
    if (!coverLetter) return;

    // Split text to avoid one giant paragraph
    const textLines = coverLetter.split("\n");

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            // Header (From Resume Data if available)
            ...(rewrittenResume?.personalInfo ? [
              new Paragraph({
                text: rewrittenResume.personalInfo.name,
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun(rewrittenResume.personalInfo.email),
                  new TextRun(" | "),
                  new TextRun(rewrittenResume.personalInfo.phone),
                ],
              }),
              new Paragraph({ text: "" }), 
              new Paragraph({ text: "" }), 
            ] : []),

            // Letter Body
            ...textLines.map((line) => 
              new Paragraph({
                children: [new TextRun(line)],
                spacing: { after: 200 }, 
              })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Tailored_Cover_Letter.docx");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isClient) return null;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN: INPUTS */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">AI Resume Sidekick</h1>
            </div>
            {extractedText && (
              <button onClick={handleStartOver} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1">
                <RefreshCw className="w-3 h-3"/> Start Over
              </button>
            )}
          </div>

          {/* 1. Upload Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Upload className="w-5 h-5 text-blue-600" /> 1. Upload Current Resume
            </h2>
            <div className="flex gap-4">
              <input
                key={resetKey}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <button
                onClick={handleUpload}
                disabled={!file || isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : "Parse PDF"}
              </button>
            </div>
            {extractedText && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" /> Resume parsed successfully
              </p>
            )}
          </div>

          {/* 2. Configuration & Job Description (HIDDEN UNTIL PARSED) */}
          {extractedText && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Settings */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" /> 2. Configuration
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                       <Linkedin className="w-4 h-4 text-blue-700"/> LinkedIn URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://linkedin.com/in/..."
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                       <Settings className="w-4 h-4 text-gray-600"/> Custom Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ignore experience before 2018..."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      className="w-full p-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* JD Input */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-[300px] flex flex-col">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                  <Briefcase className="w-5 h-5 text-blue-600" /> 3. Job Description
                </h2>
                <textarea
                  className="w-full flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                  placeholder="Paste the LinkedIn job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              {/* ACTION BUTTONS (RESUME & COVER LETTER) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleGenerateResume}
                  disabled={isGeneratingResume || !jobDescription}
                  className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 transition-all"
                >
                  {isGeneratingResume ? <Loader2 className="animate-spin" /> : <FileText className="w-4 h-4" />}
                  Generate Resume
                </button>

                <button
                  onClick={handleGenerateCoverLetter}
                  disabled={isGeneratingLetter || !jobDescription}
                  className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-all"
                >
                  {isGeneratingLetter ? <Loader2 className="animate-spin" /> : <PenTool className="w-4 h-4" />}
                  Write Cover Letter
                </button>
              </div>

            </div>
          )}
        </div>

        {/* RIGHT COLUMN: OUTPUTS */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col h-[calc(100vh-4rem)] sticky top-8 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("resume")}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${
                activeTab === "resume" 
                  ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FileText className="w-4 h-4" /> Tailored Resume
            </button>
            <button
              onClick={() => setActiveTab("letter")}
              className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 ${
                activeTab === "letter" 
                  ? "border-b-2 border-purple-600 text-purple-600 bg-purple-50/50" 
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <PenTool className="w-4 h-4" /> Cover Letter
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
            
            {/* VIEW 1: RESUME */}
            {activeTab === "resume" && (
              <div className="space-y-6">
                {!rewrittenResume ? (
                  <div className="text-center text-gray-400 mt-20">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>
                      {extractedText 
                        ? 'Ready to generate. Enter JD and click "Generate Resume".' 
                        : 'Upload a resume to get started.'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4 justify-center flex-wrap">
                       <button
                        onClick={downloadPdf}
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 shadow transition-transform hover:scale-105"
                      >
                         <Download className="w-4 h-4"/> PDF
                      </button>
                      <button
                        onClick={downloadWord}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 shadow transition-transform hover:scale-105"
                      >
                         <Download className="w-4 h-4"/> Word
                      </button>
                    </div>

                    <div className="bg-gray-50 p-4 border rounded overflow-x-auto">
                       <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Data Preview</h3>
                       <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                         {JSON.stringify(rewrittenResume, null, 2)}
                       </pre>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* VIEW 2: COVER LETTER */}
            {activeTab === "letter" && (
              <div className="space-y-4">
                 {!coverLetter && !isGeneratingLetter ? (
                  <div className="text-center text-gray-400 mt-20">
                    <PenTool className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>
                       {extractedText 
                        ? 'Ready to write. Enter JD and click "Write Cover Letter".' 
                        : 'Upload a resume to get started.'}
                    </p>
                  </div>
                ) : (
                  <>
                     {/* TOOLBAR */}
                     <div className="flex justify-between items-center mb-2">
                       <h3 className="text-sm font-bold text-gray-500 uppercase">Draft Preview</h3>
                       <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(coverLetter)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
                          >
                            {copied ? <Check className="w-3 h-3 text-green-600"/> : <Copy className="w-3 h-3"/>}
                            {copied ? "Copied" : "Copy Text"}
                          </button>
                          
                          <button
                            onClick={downloadCoverLetter}
                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            <Download className="w-3 h-3"/> Download .docx
                          </button>
                       </div>
                    </div>

                    <div className="bg-white p-8 shadow-sm border border-gray-200 min-h-[500px] whitespace-pre-wrap text-gray-700 leading-7 font-serif">
                      {coverLetter}
                      {isGeneratingLetter && (
                        <span className="inline-block w-2 h-4 ml-1 bg-purple-500 animate-pulse"/>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
            
          </div>
        </div>
        
      </div>
    </main>
  );
}