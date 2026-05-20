import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, MenuItem, CircularProgress,
  Typography, Alert, Divider, Chip, LinearProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import type { Member, Story, StoryPriority, StoryStatus, StoryType } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import AssigneeAutocomplete from './AssigneeAutocomplete';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: Member[];
  onCreated: (story: Story) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

export default function CreateStoryDialog({ open, onClose, projectId, members, onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StoryType>('story');
  const [priority, setPriority] = useState<StoryPriority>('medium');
  const [status, setStatus] = useState<StoryStatus>('todo');
  const [assignee, setAssignee] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<{
    description: string;
    acceptance_criteria: string[];
    test_cases: Array<{ title: string; steps: string[]; expected: string }>;
    story_points: number;
  } | null>(null);

  const handleGenerate = async () => {
    if (!title.trim()) {
      setError('Please enter a story title first');
      return;
    }
    setError('');
    setGenerating(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ title: title.trim(), type, priority }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      console.log('---------', data)
      setGenerated(data);
    } catch {
      setError('Failed to generate story content. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('stories')
        .insert({
          project_id: projectId,
          title: title.trim(),
          description: generated?.description ?? '',
          acceptance_criteria: generated?.acceptance_criteria ?? [],
          test_cases: generated?.test_cases ?? [],
          status,
          priority,
          type,
          story_points: generated?.story_points ?? 0,
          assignee: assignee.trim(),
          references: generated?.references ?? []
        })
        .select()
        .single();

      if (dbError) throw dbError;
      onCreated(data as Story);
      handleClose();
    } catch {
      setError('Failed to save story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setType('story');
    setPriority('medium');
    setStatus('todo');
    setAssignee('');
    setGenerated(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Create Story</Typography>
        </Box>
      </DialogTitle>

      {generating && <LinearProgress />}

      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

          <TextField
            label="Story Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            autoFocus
            placeholder="e.g. User login with email and password"
            helperText="Enter a clear title, then click Generate to auto-create acceptance criteria and test cases"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleGenerate(); }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField select label="Type" value={type} onChange={(e) => setType(e.target.value as StoryType)} sx={{ flex: 1 }}>
              <MenuItem value="story">Story</MenuItem>
              <MenuItem value="bug">Bug</MenuItem>
              <MenuItem value="task">Task</MenuItem>
              <MenuItem value="epic">Epic</MenuItem>
            </TextField>
            <TextField select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value as StoryPriority)} sx={{ flex: 1 }}>
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </TextField>
            <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as StoryStatus)} sx={{ flex: 1 }}>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="in_review">In Review</MenuItem>
              <MenuItem value="done">Done</MenuItem>
            </TextField>
            <Box sx={{ flex: 1 }}>
              <AssigneeAutocomplete
                value={assignee}
                onChange={setAssignee}
                members={members}
                label="Assignee"
                fullWidth
              />
            </Box>
          </Box>

          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={generating || !title.trim()}
            startIcon={generating ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            sx={{ alignSelf: 'flex-start' }}
          >
            {generating ? 'Generating...' : generated ? 'Regenerate with AI' : 'Generate with AI'}
          </Button>

          {generated && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                  Description
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.7, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  {generated.description}
                </Typography>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                    Acceptance Criteria
                  </Typography>
                  <Chip label={`${generated.acceptance_criteria.length} criteria`} size="small" color="success" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {generated.acceptance_criteria.map((ac, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1, p: 1.25, bgcolor: '#F6FFED', borderRadius: 1, border: '1px solid #B7EB8F' }}>
                      <Typography variant="body2" sx={{ color: '#135200', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</Typography>
                      <Typography variant="body2" sx={{ color: '#135200', lineHeight: 1.6 }}>{ac}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
                    Test Cases
                  </Typography>
                  <Chip label={`${generated.test_cases.length} tests`} size="small" color="info" />
                  <Chip label={`${generated.story_points} pts`} size="small" color="primary" />
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {generated.test_cases.map((tc, i) => (
                    <Box key={i} sx={{ p: 1.5, bgcolor: '#E6F4FF', borderRadius: 1, border: '1px solid #91CAFF' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#003EB3', mb: 0.75 }}>
                        TC{i + 1}: {tc.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#0958D9', fontWeight: 600, display: 'block', mb: 0.5 }}>Steps:</Typography>
                      {tc.steps.map((step, j) => (
                        <Typography key={j} variant="caption" sx={{ display: 'block', color: '#1D3E85', pl: 1, lineHeight: 1.8 }}>
                          {j + 1}. {step}
                        </Typography>
                      ))}
                      <Typography variant="caption" sx={{ color: '#0958D9', fontWeight: 600, display: 'block', mt: 0.75, mb: 0.25 }}>Expected:</Typography>
                      <Typography variant="caption" sx={{ color: '#1D3E85', display: 'block', pl: 1 }}>{tc.expected}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !title.trim()}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Creating...' : 'Create Story'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
