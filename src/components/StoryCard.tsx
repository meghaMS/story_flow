import {
  Card, CardContent, CardActionArea, Typography, Box, Chip, Avatar, Tooltip,
} from '@mui/material';
import BugReportIcon from '@mui/icons-material/BugReport';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import type { Story } from '../lib/supabase';

interface Props {
  story: Story;
  projectKey: string;
  index: number;
  onClick: () => void;
}

const typeConfig = {
  story: { icon: <BookmarkIcon sx={{ fontSize: 14 }} />, color: '#36B37E', label: 'Story' },
  bug: { icon: <BugReportIcon sx={{ fontSize: 14 }} />, color: '#DE350B', label: 'Bug' },
  task: { icon: <TaskAltIcon sx={{ fontSize: 14 }} />, color: '#0052CC', label: 'Task' },
  epic: { icon: <AutoAwesomeIcon sx={{ fontSize: 14 }} />, color: '#6554C0', label: 'Epic' },
};

const priorityConfig = {
  low: { icon: <ArrowDownwardIcon sx={{ fontSize: 13 }} />, color: '#36B37E' },
  medium: { icon: <RemoveIcon sx={{ fontSize: 13 }} />, color: '#FFAB00' },
  high: { icon: <ArrowUpwardIcon sx={{ fontSize: 13 }} />, color: '#FF5630' },
  critical: { icon: <PriorityHighIcon sx={{ fontSize: 13 }} />, color: '#DE350B' },
};

export default function StoryCard({ story, projectKey, index, onClick }: Props) {
  const type = typeConfig[story.type] ?? typeConfig.story;
  const priority = priorityConfig[story.priority] ?? priorityConfig.medium;

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('storyId', story.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      sx={{
        mb: 1,
        cursor: 'grab',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease, opacity 0.15s ease',
        '&:hover': { transform: 'translateY(-1px)', boxShadow: 3 },
        '&:active': { cursor: 'grabbing', opacity: 0.7 },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ p: 0 }}>
        <CardContent sx={{ p: '10px 12px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.75 }}>
            <Chip
              icon={type.icon}
              label={type.label}
              size="small"
              sx={{
                bgcolor: `${type.color}18`,
                color: type.color,
                border: `1px solid ${type.color}40`,
                height: 20,
                '& .MuiChip-icon': { color: type.color, ml: '4px' },
                '& .MuiChip-label': { px: '6px', fontSize: '0.65rem' },
              }}
            />
            <Box sx={{ flex: 1 }} />
            {story.story_points > 0 && (
              <Tooltip title="Story Points">
                <Box
                  sx={{
                    width: 20, height: 20, borderRadius: '50%',
                    bgcolor: 'primary.main', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                  }}
                >
                  {story.story_points}
                </Box>
              </Tooltip>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: 'text.primary',
              lineHeight: 1.4,
              mb: 1,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {story.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace', fontWeight: 600 }}>
              {projectKey}-{index + 1}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={`Priority: ${story.priority}`}>
                <Box sx={{ color: priority.color, display: 'flex', alignItems: 'center' }}>
                  {priority.icon}
                </Box>
              </Tooltip>
              {story.assignee && (
                <Tooltip title={story.assignee}>
                  <Avatar sx={{ width: 20, height: 20, fontSize: '0.6rem', bgcolor: 'primary.light' }}>
                    {story.assignee.charAt(0).toUpperCase()}
                  </Avatar>
                </Tooltip>
              )}
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
