/*
  # Create members table

  1. New Tables
    - `members`
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key to projects, nullable — null means global/workspace member)
      - `name` (text, not null)
      - `email` (text)
      - `role` (text: 'developer' | 'designer' | 'qa' | 'manager' | 'other', default 'developer')
      - `avatar_color` (text, hex color for avatar)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `members` table
    - Policies matching existing tables (permissive for anon + authenticated)

  3. Notes
    - project_id is nullable to allow future workspace-level members
    - avatar_color stored so avatars are consistent across the UI
*/

CREATE TABLE IF NOT EXISTS members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES projects(id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        text NOT NULL DEFAULT '',
  role         text NOT NULL DEFAULT 'developer',
  avatar_color text NOT NULL DEFAULT '#0052CC',
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read members"
  ON members FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow insert members"
  ON members FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update members"
  ON members FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete members"
  ON members FOR DELETE
  TO anon, authenticated
  USING (true);
