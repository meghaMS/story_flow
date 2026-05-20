import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Chip, Divider, Button, IconButton,
  Avatar, MenuItem, TextField, Tooltip, Alert,
  Accordion, AccordionSummary, AccordionDetails, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import BugReportIcon from '@mui/icons-material/BugReport';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LinkIcon from '@mui/icons-material/Link';
import type { Member, Story, StoryPriority, StoryStatus, StoryType } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import AssigneeAutocomplete from './AssigneeAutocomplete';

interface Props {
  open: boolean;
  story: Story | null;
  projectKey: string;
  storyIndex: number;
  members: Member[];
  onClose: () => void;
  onUpdated: (story: Story) => void;
  onDeleted: (id: string) => void;
}

const statusColors: Record<StoryStatus, string> = {
  todo: '#DFE1E6',
  in_progress: '#0052CC',
  in_review: '#FF8B00',
  done: '#00875A',
};

const statusLabels: Record<StoryStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
};

const typeIcons: Record<StoryType, React.ReactNode> = {
  story: <BookmarkIcon sx={{ fontSize: 16 }} />,
  bug: <BugReportIcon sx={{ fontSize: 16 }} />,
  task: <TaskAltIcon sx={{ fontSize: 16 }} />,
  epic: <AutoAwesomeIcon sx={{ fontSize: 16 }} />,
};

const typeColors: Record<StoryType, string> = {
  story: '#36B37E',
  bug: '#DE350B',
  task: '#0052CC',
  epic: '#6554C0',
};

const priorityColors: Record<StoryPriority, string> = {
  low: '#36B37E',
  medium: '#FFAB00',
  high: '#FF5630',
  critical: '#DE350B',
};

export default function StoryDetailDialog({ open, story, projectKey, storyIndex, members, onClose, onUpdated, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [editData, setEditData] = useState<Partial<Story>>({});

  if (!story) return null;

  const current = editing ? { ...story, ...editData } : story;

  const handleEdit = () => {
    setEditData({});
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('stories')
        .update({ ...editData, updated_at: new Date().toISOString() })
        .eq('id', story.id)
        .select()
        .single();
      if (dbError) throw dbError;
      onUpdated(data as Story);
      setEditing(false);
      setEditData({});
    } catch {
      setError('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this story? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      const { error: dbError } = await supabase.from('stories').delete().eq('id', story.id);
      if (dbError) throw dbError;
      onDeleted(story.id);
      onClose();
    } catch {
      setError('Failed to delete story.');
    } finally {
      setDeleting(false);
    }
  };

  const field = <K extends keyof Story>(key: K, value: Story[K]) =>
    setEditData((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 1, pr: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ color: typeColors[current.type], mt: 0.25 }}>{typeIcons[current.type]}</Box>
          <Box sx={{ flex: 1 }}>
            {editing ? (
              <TextField
                value={current.title}
                onChange={(e) => field('title', e.target.value)}
                fullWidth
                variant="standard"
                InputProps={{ style: { fontSize: '1.1rem', fontWeight: 600 } }}
              />
            ) : (
              <Typography variant="h6" sx={{ lineHeight: 1.3 }}>{current.title}</Typography>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontWeight: 600 }}>
              {projectKey}-{storyIndex + 1}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            {!editing && (
              <Tooltip title="Edit">
                <IconButton size="small" onClick={handleEdit}><EditIcon fontSize="small" /></IconButton>
              </Tooltip>
            )}
            {editing && (
              <Tooltip title="Save">
                <IconButton size="small" color="primary" onClick={handleSave} disabled={saving}>
                  {saving ? <CircularProgress size={16} /> : <SaveIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={handleDelete} disabled={deleting}>
                {deleting ? <CircularProgress size={16} /> : <DeleteIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <Box sx={{ display: 'flex', gap: 3 }}>
          {/* Main Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1, mb: 1 }}>
                Description
              </Typography>
              {editing ? (
                <TextField
                  value={current.description}
                  onChange={(e) => field('description', e.target.value)}
                  fullWidth multiline rows={3} size="small"
                />
              ) : (
                <Typography variant="body2" sx={{ color: current.description ? 'text.primary' : 'text.secondary', lineHeight: 1.7, fontStyle: current.description ? 'normal' : 'italic' }}>
                  {current.description || 'No description provided.'}
                </Typography>
              )}
            </Box>

            {current.acceptance_criteria.length > 0 && (
              <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50', borderRadius: '4px 4px 0 0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="subtitle2">Acceptance Criteria</Typography>
                    <Chip label={current.acceptance_criteria.length} size="small" color="success" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {current.acceptance_criteria.map((ac, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, p: 1.25, bgcolor: '#F6FFED', borderRadius: 1, border: '1px solid #B7EB8F' }}>
                        <Typography variant="body2" sx={{ color: '#135200', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</Typography>
                        <Typography variant="body2" sx={{ color: '#135200', lineHeight: 1.6 }}>{ac}</Typography>
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {current.references?.length > 0 && (
              <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50', borderRadius: '4px 4px 0 0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinkIcon sx={{ fontSize: 18, color: 'warning.main' }} />
                    <Typography variant="subtitle2">References</Typography>
                    <Chip label={current.references.length} size="small" color="warning" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {current.references.map((ref, i) => (
                        <Typography
                          component="a"
                          href={ref}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                          sx={{ color: '#874D00', wordBreak: 'break-all', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {ref}
                        </Typography>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {current.test_cases.length > 0 && (
              <Accordion defaultExpanded sx={{ mb: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', '&:before': { display: 'none' } }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.50', borderRadius: '4px 4px 0 0' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScienceIcon sx={{ fontSize: 18, color: 'info.main' }} />
                    <Typography variant="subtitle2">Test Cases</Typography>
                    <Chip label={current.test_cases.length} size="small" color="info" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 1.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {current.test_cases.map((tc, i) => (
                      <Box key={i} sx={{ p: 1.5, bgcolor: '#E6F4FF', borderRadius: 1, border: '1px solid #91CAFF' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#003EB3', mb: 1 }}>
                          TC{i + 1}: {tc.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#0958D9', fontWeight: 600, display: 'block', mb: 0.5 }}>Steps:</Typography>
                        {tc.steps.map((step, j) => (
                          <Typography key={j} variant="caption" sx={{ display: 'block', color: '#1D3E85', pl: 1.5, lineHeight: 1.9 }}>
                            {j + 1}. {step}
                          </Typography>
                        ))}
                        <Divider sx={{ my: 0.75, borderColor: '#91CAFF' }} />
                        <Typography variant="caption" sx={{ color: '#0958D9', fontWeight: 600, display: 'block', mb: 0.25 }}>Expected Result:</Typography>
                        <Typography variant="caption" sx={{ color: '#1D3E85', display: 'block', pl: 1.5 }}>{tc.expected}</Typography>
                      </Box>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>

          {/* Sidebar */}
          <Box sx={{ width: 220, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Status</Typography>
                {editing ? (
                  <TextField select value={current.status} onChange={(e) => field('status', e.target.value as StoryStatus)} fullWidth size="small" sx={{ mt: 0.5 }}>
                    <MenuItem value="todo">To Do</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="in_review">In Review</MenuItem>
                    <MenuItem value="done">Done</MenuItem>
                  </TextField>
                ) : (
                  <Chip
                    label={statusLabels[current.status]}
                    size="small"
                    sx={{ mt: 0.5, display: 'flex', width: 'fit-content', bgcolor: `${statusColors[current.status]}22`, color: statusColors[current.status] === '#DFE1E6' ? 'text.secondary' : statusColors[current.status], border: `1px solid ${statusColors[current.status]}60`, fontWeight: 600 }}
                  />
                )}
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Priority</Typography>
                {editing ? (
                  <TextField select value={current.priority} onChange={(e) => field('priority', e.target.value as StoryPriority)} fullWidth size="small" sx={{ mt: 0.5 }}>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </TextField>
                ) : (
                  <Chip
                    label={current.priority.charAt(0).toUpperCase() + current.priority.slice(1)}
                    size="small"
                    sx={{ mt: 0.5, display: 'flex', width: 'fit-content', bgcolor: `${priorityColors[current.priority]}18`, color: priorityColors[current.priority], border: `1px solid ${priorityColors[current.priority]}50`, fontWeight: 600 }}
                  />
                )}
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Type</Typography>
                {editing ? (
                  <TextField select value={current.type} onChange={(e) => field('type', e.target.value as StoryType)} fullWidth size="small" sx={{ mt: 0.5 }}>
                    <MenuItem value="story">Story</MenuItem>
                    <MenuItem value="bug">Bug</MenuItem>
                    <MenuItem value="task">Task</MenuItem>
                    <MenuItem value="epic">Epic</MenuItem>
                  </TextField>
                ) : (
                  <Chip
                    icon={typeIcons[current.type] as React.ReactElement}
                    label={current.type.charAt(0).toUpperCase() + current.type.slice(1)}
                    size="small"
                    sx={{ mt: 0.5, display: 'flex', width: 'fit-content', bgcolor: `${typeColors[current.type]}18`, color: typeColors[current.type], border: `1px solid ${typeColors[current.type]}50`, fontWeight: 600, '& .MuiChip-icon': { color: typeColors[current.type] } }}
                  />
                )}
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Story Points</Typography>
                {editing ? (
                  <TextField type="number" value={current.story_points} onChange={(e) => field('story_points', parseInt(e.target.value) || 0)} fullWidth size="small" sx={{ mt: 0.5 }} inputProps={{ min: 0, max: 100 }} />
                ) : (
                  <Box sx={{ mt: 0.5, width: 28, height: 28, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {current.story_points}
                  </Box>
                )}
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Assignee</Typography>
                {editing ? (
                  <Box sx={{ mt: 0.5 }}>
                    <AssigneeAutocomplete
                      value={current.assignee}
                      onChange={(val) => field('assignee', val)}
                      members={members}
                      size="small"
                      label="Assignee"
                      fullWidth
                    />
                  </Box>
                ) : (
                  <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1 }}>
                    {current.assignee ? (
                      <>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: members.find((m) => m.name === current.assignee)?.avatar_color ?? 'primary.light' }}>
                          {current.assignee.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2">{current.assignee}</Typography>
                      </>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Unassigned</Typography>
                    )}
                  </Box>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Created: {new Date(current.created_at).toLocaleDateString()}
                </Typography>
                <br />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Updated: {new Date(current.updated_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      {editing && (
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => { setEditing(false); setEditData({}); }}>Discard Changes</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}>
            Save Changes
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
