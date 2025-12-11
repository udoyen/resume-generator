# AI Resume Builder

A Next.js application that uses Generative AI (Google Gemini) to rewrite and tailor resumes to specific job descriptions. It outputs a clean, professional PDF or editable Word document.

## 🚀 Features

-   **PDF Parsing:** Extracts text from uploaded PDF resumes.
-   **AI Rewriting:** Uses Google Gemini 2.5 Flash to rewrite bullet points and summaries based on job descriptions.
-   **Smart Formatting:** Automatically formats the result into a clean, professional layout.
-   **Multi-Format Export:** Download the result as a **PDF** or **Microsoft Word (.docx)** file.
-   **LinkedIn Integration:** Prioritizes user-provided LinkedIn URLs in the contact header.

## 🛠️ Tech Stack

-   **Framework:** Next.js (App Router)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS
-   **AI:** Google Gemini API (`@ai-sdk/google`)
-   **PDF Generation:** `@react-pdf/renderer`
-   **Word Generation:** `docx`
-   **Parsing:** `pdf2json`

## 📦 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/ai-resume-builder.git](https://github.com/your-username/ai-resume-builder.git)
    cd ai-resume-builder
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory:
    ```env
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📄 License

**Non-Commercial Use Only.**

This project is licensed under the **Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**.

-   ✅ **Free to use** for personal, educational, and non-profit purposes.
-   ✅ **Attribution required** if you modify or share this code.
-   ❌ **Commercial use is strictly prohibited** without prior permission.

**Commercial Inquiries:**
If you wish to use this software for commercial purposes, please make a formal request by contacting: George Ekanem Udosen 

=============

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.