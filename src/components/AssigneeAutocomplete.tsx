import { useState, useRef, useEffect } from 'react';
import {
  Box, TextField, Paper, Typography, Avatar, ClickAwayListener,
} from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import type { Member } from '../lib/supabase';

interface Props {
  value: string;
  onChange: (name: string) => void;
  members: Member[];
  size?: 'small' | 'medium';
  label?: string;
  fullWidth?: boolean;
}

function memberInitials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
}

export default function AssigneeAutocomplete({ value, onChange, members, size = 'medium', label = 'Assignee', fullWidth = false }: Props) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = members.filter(
    (m) => !inputValue.trim() || m.name.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const handleSelect = (name: string) => {
    setInputValue(name);
    onChange(name);
    setOpen(false);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    onChange(val);
    setOpen(true);
  };

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', ...(fullWidth ? { width: '100%' } : {}) }}>
        <TextField
          inputRef={inputRef}
          label={label}
          value={inputValue}
          size={size}
          fullWidth={fullWidth}
          placeholder="Search or type a name"
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          InputProps={{
            startAdornment: inputValue ? (
              <Avatar
                sx={{
                  width: 22,
                  height: 22,
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  mr: 0.75,
                  bgcolor: members.find((m) => m.name === inputValue)?.avatar_color ?? '#0052CC',
                  flexShrink: 0,
                }}
              >
                {memberInitials(inputValue)}
              </Avatar>
            ) : (
              <PersonAddAlt1Icon sx={{ fontSize: 18, color: 'text.secondary', mr: 0.75, flexShrink: 0 }} />
            ),
          }}
        />

        {open && filtered.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 1400,
              mt: 0.5,
              borderRadius: 1.5,
              overflow: 'hidden',
              maxHeight: 220,
              overflowY: 'auto',
            }}
          >
            {filtered.map((m) => (
              <Box
                key={m.id}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(m.name); }}
                sx={{
                  px: 1.5,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 700, bgcolor: m.avatar_color, flexShrink: 0 }}>
                  {memberInitials(m.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>{m.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1 }}>
                    {m.role.charAt(0).toUpperCase() + m.role.slice(1)}{m.email ? ` · ${m.email}` : ''}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
