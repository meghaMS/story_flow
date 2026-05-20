import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Button, IconButton, Alert,
  Divider, CircularProgress, List, ListItem,
  ListItemIcon, ListItemText, Collapse,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorageIcon from '@mui/icons-material/Storage';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { supabase } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  onStoriesCleared: () => void;
  onAllDataCleared: () => void;
}

const SQL_QUERIES = [
  {
    label: 'Delete all stories in current project',
    sql: "DELETE FROM stories WHERE project_id = 'YOUR_PROJECT_ID';",
    description: 'Removes every story belonging to a specific project. Replace YOUR_PROJECT_ID with the actual project UUID.',
  },
  {
    label: 'Delete all stories (every project)',
    sql: 'DELETE FROM stories;',
    description: 'Removes every story across all projects. Projects themselves are kept.',
  },
  {
    label: 'Delete a specific project and its stories',
    sql: "DELETE FROM projects WHERE key = 'YOUR_PROJECT_KEY';",
    description: 'Removes a project by its key. Stories are cascade-deleted automatically. Replace YOUR_PROJECT_KEY with the project key (e.g. DEMO).',
  },
  {
    label: 'Delete all projects (and their stories)',
    sql: 'DELETE FROM projects;',
    description: 'Removes every project. All associated stories are cascade-deleted automatically.',
  },
  {
    label: 'Delete stories by status',
    sql: "DELETE FROM stories WHERE status = 'todo';",
    description: 'Removes stories matching a specific status. Replace "todo" with in_progress, in_review, or done.',
  },
  {
    label: 'Delete stories by type',
    sql: "DELETE FROM stories WHERE type = 'bug';",
    description: 'Removes stories matching a specific type. Replace "bug" with story, task, or epic.',
  },
  {
    label: 'Delete stories by priority',
    sql: "DELETE FROM stories WHERE priority = 'low';",
    description: 'Removes stories matching a specific priority. Replace "low" with medium, high, or critical.',
  },
  {
    label: 'Reset all data (stories + projects)',
    sql: 'DELETE FROM stories; DELETE FROM projects;',
    description: 'Wipes the entire database clean. All projects and stories are permanently removed.',
  },
];

export default function DataManagementDialog({ open, onClose, projectId, onStoriesCleared, onAllDataCleared }: Props) {
  const [confirmAction, setConfirmAction] = useState<'stories' | 'all' | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleDeleteStories = async () => {
    if (!projectId) return;
    setDeleting(true);
    setError('');
    try {
      const { error: err } = await supabase.from('stories').delete().eq('project_id', projectId);
      if (err) throw err;
      onStoriesCleared();
      setConfirmAction(null);
      onClose();
    } catch {
      setError('Failed to delete stories.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    setError('');
    try {
      const { error: sErr } = await supabase.from('stories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (sErr) throw sErr;
      const { error: pErr } = await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (pErr) throw pErr;
      onAllDataCleared();
      setConfirmAction(null);
      onClose();
    } catch {
      setError('Failed to delete all data.');
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = (sql: string, index: number) => {
    navigator.clipboard.writeText(sql);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClose = () => {
    setConfirmAction(null);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StorageIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Data Management</Typography>
        </Box>
        <IconButton onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Quick Actions */}
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
          Quick Actions
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, mb: 3 }}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<DeleteSweepIcon />}
            onClick={() => setConfirmAction('stories')}
            disabled={!projectId}
            size="small"
          >
            Clear Project Stories
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={() => setConfirmAction('all')}
            size="small"
          >
            Delete All Data
          </Button>
        </Box>

        {/* Confirm stories delete */}
        <Collapse in={confirmAction === 'stories'}>
          <Alert
            severity="warning"
            icon={<WarningAmberIcon />}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button size="small" color="error" variant="contained" onClick={handleDeleteStories} disabled={deleting} startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}>
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </Box>
            }
            sx={{ mb: 2 }}
          >
            This will permanently delete all stories in the current project. This cannot be undone.
          </Alert>
        </Collapse>

        {/* Confirm all data delete */}
        <Collapse in={confirmAction === 'all'}>
          <Alert
            severity="error"
            icon={<WarningAmberIcon />}
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => setConfirmAction(null)}>Cancel</Button>
                <Button size="small" color="error" variant="contained" onClick={handleDeleteAll} disabled={deleting} startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}>
                  {deleting ? 'Deleting...' : 'Confirm Delete All'}
                </Button>
              </Box>
            }
            sx={{ mb: 2 }}
          >
            This will permanently delete ALL projects and stories. This cannot be undone.
          </Alert>
        </Collapse>

        <Divider sx={{ mb: 2 }} />

        {/* SQL Reference */}
        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: 1 }}>
          SQL Reference — Run in Supabase SQL Editor
        </Typography>
        <Typography variant="caption" sx={{ display: 'block', mb: 2, color: 'text.secondary' }}>
          Copy these queries and run them in your Supabase dashboard under SQL Editor for more granular control.
        </Typography>

        <List disablePadding>
          {SQL_QUERIES.map((item, i) => (
            <ListItem
              key={i}
              disablePadding
              sx={{
                mb: 1.5,
                p: 1.5,
                bgcolor: 'grey.50',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                flexDirection: 'column',
                alignItems: 'stretch',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
                <CodeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, flex: 1 }}>{item.label}</Typography>
              </Box>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.75, lineHeight: 1.5 }}>
                {item.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#1e293b', borderRadius: 0.5, p: 1, overflow: 'auto' }}>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#e2e8f0', flex: 1, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>
                  {item.sql}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(item.sql, i)}
                  sx={{ color: copiedIndex === i ? '#4ade80' : '#94a3b8' }}
                >
                  {copiedIndex === i ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
                </IconButton>
              </Box>
            </ListItem>
          ))}
        </List>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
