# Domna Work OS

A Monday.com-style operations board for Domna, built with Next.js and Supabase.

## What this version includes

- Styled board interface
- Boards, groups, tasks, comments
- Domna EPC Pipeline board
- Assessor Performance board
- Add task from the UI
- Open task details and add comments
- Live data from Supabase

## 1. Upload to GitHub

Create a new GitHub repository called `domna-work-os` and upload all files from this folder.

## 2. Create Supabase project

In Supabase:

- Create a new project
- Open the SQL Editor
- Run the SQL in `supabase/schema.sql`
- Open Project Settings > API
- Copy:
  - Project URL
  - anon public key

## 3. Add environment variables

In GitHub or locally, create a file called `.env.local` using `.env.example` as a reference:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Deploy to Vercel

- Import the GitHub repository into Vercel
- Add the same environment variables in Vercel Settings > Environment Variables
- Deploy

## 5. Optional local run

```bash
npm install
npm run dev
```

## Notes

This project is intentionally kept light to reduce deployment issues.
