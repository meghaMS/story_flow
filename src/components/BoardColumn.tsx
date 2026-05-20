import { useState } from 'react';
import { Box, Typography, Paper, Chip, Skeleton } from '@mui/material';
import type { Story, StoryStatus } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import StoryCard from './StoryCard';

interface Props {
  title: string;
  status: StoryStatus;
  stories: Story[];
  projectKey: string;
  allStories: Story[];
  color: string;
  loading?: boolean;
  onStoryClick: (story: Story) => void;
  onStoryMoved: (storyId: string, newStatus: StoryStatus) => void;
}

export default function BoardColumn({ title, status, stories, projectKey, allStories, color, loading, onStoryClick, onStoryMoved }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const points = stories.reduce((sum, s) => sum + (s.story_points || 0), 0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the column entirely (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const storyId = e.dataTransfer.getData('storyId');
    if (!storyId) return;

    const story = allStories.find((s) => s.id === storyId);
    if (!story || story.status === status) return;

    // Optimistic update
    onStoryMoved(storyId, status);

    await supabase
      .from('stories')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', storyId);
  };

  return (
    <Paper
      elevation={0}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        flex: '0 0 270px',
        minWidth: 270,
        maxWidth: 270,
        bgcolor: isDragOver ? '#E8F0FE' : '#F4F5F7',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
        outline: isDragOver ? `2px dashed ${color}` : '2px dashed transparent',
        transition: 'background-color 0.15s ease, outline 0.15s ease',
      }}
    >
      <Box
        sx={{
          p: '10px 12px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: '2px solid',
          borderColor: color,
          borderRadius: '8px 8px 0 0',
        }}
      >
        <Box
          sx={{
            width: 10, height: 10, borderRadius: '50%',
            bgcolor: color, flexShrink: 0,
          }}
        />
        <Typography
          variant="subtitle2"
          sx={{ flex: 1, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.8, color: 'text.secondary' }}
        >
          {title}
        </Typography>
        <Chip label={stories.length} size="small" sx={{ height: 18, '& .MuiChip-label': { px: '6px', fontSize: '0.65rem', fontWeight: 700 }, bgcolor: 'white', border: '1px solid', borderColor: 'divider' }} />
        {points > 0 && (
          <Chip label={`${points}pt`} size="small" sx={{ height: 18, '& .MuiChip-label': { px: '5px', fontSize: '0.6rem', fontWeight: 700 }, bgcolor: `${color}22`, color: color, border: `1px solid ${color}50` }} />
        )}
      </Box>

      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: '8px',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={90} sx={{ mb: 1, borderRadius: 1 }} />
          ))
        ) : stories.length === 0 ? (
          <Box
            sx={{
              height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px dashed', borderColor: isDragOver ? color : 'divider',
              borderRadius: 1, color: 'text.secondary',
              transition: 'border-color 0.15s ease',
            }}
          >
            <Typography variant="caption">{isDragOver ? 'Drop here' : 'No stories'}</Typography>
          </Box>
        ) : (
          stories.map((story) => {
            const idx = allStories.findIndex((s) => s.id === story.id);
            return (
              <StoryCard
                key={story.id}
                story={story}
                projectKey={projectKey}
                index={idx}
                onClick={() => onStoryClick(story)}
              />
            );
          })
        )}
      </Box>
    </Paper>
  );
}
