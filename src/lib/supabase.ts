import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type StoryStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type StoryPriority = 'low' | 'medium' | 'high' | 'critical';
export type StoryType = 'story' | 'bug' | 'task' | 'epic';
export type MemberRole = 'developer' | 'designer' | 'qa' | 'manager' | 'other';

export interface TestCase {
  title: string;
  steps: string[];
  expected: string;
}

export interface Story {
  id: string;
  project_id: string;
  title: string;
  description: string;
  acceptance_criteria: string[];
  test_cases: TestCase[];
  status: StoryStatus;
  priority: StoryPriority;
  type: StoryType;
  story_points: number;
  assignee: string;
  references: string[];
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Member {
  id: string;
  project_id: string | null;
  name: string;
  email: string;
  role: MemberRole;
  avatar_color: string;
  created_at: string;
}
