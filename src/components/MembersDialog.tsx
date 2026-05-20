import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Typography, Box, Button, IconButton, Avatar, TextField,
  MenuItem, Alert, CircularProgress, Divider, Chip, Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Member, MemberRole, Project } from '../lib/supabase';
import { supabase } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  members: Member[];
  onMembersChanged: (members: Member[]) => void;
}

const ROLES: MemberRole[] = ['developer', 'designer', 'qa', 'manager', 'other'];

const AVATAR_COLORS = [
  '#0052CC', '#00875A', '#DE350B', '#FF8B00', '#6554C0',
  '#00B8D9', '#36B37E', '#FF5630', '#FFAB00', '#403294',
];

const ROLE_COLORS: Record<MemberRole, string> = {
  developer: '#0052CC',
  designer:  '#6554C0',
  qa:        '#FF8B00',
  manager:   '#00875A',
  other:     '#6B778C',
};

function memberInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function MembersDialog({ open, onClose, project, members, onMembersChanged }: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole>('developer');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) { setAdding(false); setError(''); }
  }, [open]);

  const pickedColor = AVATAR_COLORS[members.length % AVATAR_COLORS.length];

  const handleAdd = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('members')
        .insert({
          project_id: project?.id ?? null,
          name: name.trim(),
          email: email.trim(),
          role,
          avatar_color: pickedColor,
        })
        .select()
        .single();
      if (err) throw err;
      onMembersChanged([...members, data as Member]);
      setName('');
      setEmail('');
      setRole('developer');
      setAdding(false);
    } catch {
      setError('Failed to add member.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error: err } = await supabase.from('members').delete().eq('id', id);
      if (err) throw err;
      onMembersChanged(members.filter((m) => m.id !== id));
    } catch {
      setError('Failed to remove member.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: 'primary.main' }} />
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2 }}>Team Members</Typography>
            {project && (
              <Typography variant="caption" color="text.secondary">{project.name}</Typography>
            )}
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Member list */}
        {members.length === 0 && !adding ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.25, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">No members yet. Add one to get started.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: adding ? 2 : 0 }}>
            {members.map((m, i) => (
              <Box key={m.id}>
                {i > 0 && <Divider sx={{ my: 0.25 }} />}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75, px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'grey.50' } }}>
                  <Avatar sx={{ width: 36, height: 36, fontSize: '0.75rem', fontWeight: 700, bgcolor: m.avatar_color, flexShrink: 0 }}>
                    {memberInitials(m.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2 }}>
                      <Chip
                        label={m.role.charAt(0).toUpperCase() + m.role.slice(1)}
                        size="small"
                        sx={{
                          height: 16,
                          '& .MuiChip-label': { px: '6px', fontSize: '0.6rem', fontWeight: 700 },
                          bgcolor: `${ROLE_COLORS[m.role as MemberRole]}18`,
                          color: ROLE_COLORS[m.role as MemberRole],
                        }}
                      />
                      {m.email && (
                        <Typography variant="caption" color="text.secondary" noWrap>{m.email}</Typography>
                      )}
                    </Box>
                  </Box>
                  <Tooltip title="Remove member">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(m.id)}
                      disabled={deletingId === m.id}
                    >
                      {deletingId === m.id
                        ? <CircularProgress size={14} color="inherit" />
                        : <DeleteIcon sx={{ fontSize: 16 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Add member form */}
        {adding && (
          <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>New Member</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'flex-start' }}>
              <Avatar sx={{ width: 40, height: 40, fontSize: '0.8rem', fontWeight: 700, bgcolor: pickedColor, mt: 0.5, flexShrink: 0 }}>
                {name.trim() ? memberInitials(name) : '?'}
              </Avatar>
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <TextField
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  size="small"
                  fullWidth
                  autoFocus
                  placeholder="e.g. Jane Smith"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                />
                <TextField
                  label="Email (optional)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  size="small"
                  fullWidth
                  placeholder="jane@example.com"
                  type="email"
                />
                <TextField
                  select
                  label="Role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as MemberRole)}
                  size="small"
                  fullWidth
                >
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button size="small" onClick={() => { setAdding(false); setName(''); setEmail(''); setRole('developer'); setError(''); }}>
                Cancel
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleAdd}
                disabled={saving || !name.trim()}
                startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
              >
                {saving ? 'Adding...' : 'Add Member'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button onClick={onClose}>Close</Button>
          {!adding && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
              Add Member
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
}
