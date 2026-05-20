/*
  # Jira-like Application Schema

  ## New Tables
  - `projects` - Holds project information (key, name, description)
  - `stories` - User stories with status, priority, type, acceptance criteria, and test cases

  ## Columns
  ### projects
    - `id` (uuid, pk)
    - `key` (text, unique) - short project key like "PROJ"
    - `name` (text)
    - `description` (text)
    - `created_at` (timestamptz)

  ### stories
    - `id` (uuid, pk)
    - `project_id` (uuid, fk -> projects)
    - `title` (text)
    - `description` (text)
    - `acceptance_criteria` (jsonb) - array of criteria strings
    - `test_cases` (jsonb) - array of test case objects {title, steps, expected}
    - `status` (text) - 'todo' | 'in_progress' | 'in_review' | 'done'
    - `priority` (text) - 'low' | 'medium' | 'high' | 'critical'
    - `type` (text) - 'story' | 'bug' | 'task' | 'epic'
    - `story_points` (int)
    - `assignee` (text)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Public read/write policies for demo purposes (authenticated or anon)
*/

CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  acceptance_criteria jsonb DEFAULT '[]'::jsonb,
  test_cases jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'todo',
  priority text DEFAULT 'medium',
  type text DEFAULT 'story',
  story_points int DEFAULT 0,
  assignee text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects"
  ON projects FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert projects"
  ON projects FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update projects"
  ON projects FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete projects"
  ON projects FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can view stories"
  ON stories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert stories"
  ON stories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update stories"
  ON stories FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete stories"
  ON stories FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO projects (key, name, description)
VALUES ('DEMO', 'Demo Project', 'A sample project to get you started')
ON CONFLICT (key) DO NOTHING;
