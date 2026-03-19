# Domna Homes Operations Platform

## Files to upload to GitHub

Upload this whole folder to your GitHub repository.

## Vercel environment variables

Add these in Vercel:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

## Supabase SQL fix

Run this if needed:

```sql
alter table boards add column if not exists position integer default 0;
```
