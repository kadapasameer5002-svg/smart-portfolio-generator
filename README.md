# Smart Portfolio Generator

Smart Portfolio is an intelligent Next.js web application that instantly converts your uploaded resume (PDF, DOCX, TXT) into a beautiful, fully-responsive professional portfolio. It automatically extracts your experience, education, projects, skills, and certifications, allowing you to review and edit the information before generating a final portfolio.

## Features

- **Intelligent Resume Parsing:** Automatically extracts structured data from PDF, DOCX, or TXT resumes using advanced heuristics.
- **Interactive Review Dashboard:** A sleek UI to edit and verify all extracted sections before publishing.
- **Live Preview:** See exactly what your portfolio will look like in real-time.
- **One-Click HTML Export:** Download your entire portfolio as a completely standalone, offline-ready HTML file with all CSS, images, and fonts securely inlined.
- **Public Hosted Routes:** Automatically generates a public, unique URL for your portfolio using Supabase.

## Technologies Used

- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS (Dashboard) & Bootstrap (Generated Portfolio)
- **Database:** Supabase (PostgreSQL)
- **Parsing:** pdf2json, mammoth (docx)

## Prerequisites

- Node.js 18+
- npm or pnpm
- A Supabase Project (for cloud database storage)

## Installation & Setup

1. **Clone the repository:**
   \\\ash
   git clone https://github.com/yourusername/smart-portfolio.git
   cd smart-portfolio
   \\\

2. **Install dependencies:**
   \\\ash
   npm install
   \\\

3. **Set up Environment Variables:**
   Copy the example environment file and fill in your Supabase credentials:
   \\\ash
   cp .env.example .env.local
   \\\
   You will need to add your \NEXT_PUBLIC_SUPABASE_URL\ and \NEXT_PUBLIC_SUPABASE_ANON_KEY\.

4. **Set up Supabase Database:**
   Run the following SQL in your Supabase SQL Editor to create the required table:
   \\\sql
   CREATE TABLE portfolios (
       id uuid default uuid_generate_v4() primary key,
       slug text unique not null,
       portfolio_data jsonb not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   \\\

5. **Run the Development Server:**
   \\\ash
   npm run dev
   \\\
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment Instructions

### Deploying to Vercel (Recommended)
Because this application uses Next.js **Server-Side API Routes** (for PDF parsing and HTML bundling), it is **NOT** compatible with GitHub Pages (which only hosts static frontend files). 

The best way to deploy this application is using Vercel:

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/) and sign in with GitHub.
3. Click **Add New Project** and import your \smart-portfolio\ repository.
4. In the Environment Variables section, add:
   - \NEXT_PUBLIC_SUPABASE_URL\
   - \NEXT_PUBLIC_SUPABASE_ANON_KEY\
5. Click **Deploy**. Your application will be live in minutes with all API parsing routes fully functional!

### Why not GitHub Pages?
GitHub pages is designed for static site generation (\
ext export\). However, Smart Portfolio requires an active Node.js server environment to parse uploaded PDFs using \pdf2json\ and bundle offline HTML using the filesystem (\s\). Therefore, deploying to a serverless provider like Vercel or Netlify is required.

smart portfolio render live link :https://smart-portfolio-generator-pmh7.onrender.com
