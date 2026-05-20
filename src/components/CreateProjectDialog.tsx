import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Alert, Typography, Box,
} from '@mui/material';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import { supabase } from '../lib/supabase';
import type { Project } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

export default function CreateProjectDialog({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!key || key === name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4)) {
      setKey(val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4));
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !key.trim()) {
      setError('Name and key are required');
      return;
    }
    if (!/^[A-Z]{2,6}$/.test(key)) {
      setError('Key must be 2–6 uppercase letters only');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const { data, error: dbError } = await supabase
        .from('projects')
        .insert({ name: name.trim(), key: key.trim(), description: description.trim() })
        .select()
        .single();
      if (dbError) throw dbError;
      onCreated(data as Project);
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes('unique') ? 'Project key already exists. Choose a different key.' : 'Failed to create project.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setKey('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FolderSpecialIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Create Project</Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          <TextField
            label="Project Name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            fullWidth autoFocus
            placeholder="e.g. My Awesome App"
          />
          <TextField
            label="Project Key"
            value={key}
            onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))}
            fullWidth
            helperText="2–6 uppercase letters. Used as prefix for story IDs (e.g. PROJ-1)."
            inputProps={{ maxLength: 6 }}
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth multiline rows={2}
            placeholder="What is this project about?"
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !name.trim() || !key.trim()} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {saving ? 'Creating...' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
