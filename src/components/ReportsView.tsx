import { useMemo, useState } from 'react';
import {
  Box, Typography, FormControl, InputLabel, Select, MenuItem,
  Paper, Chip, Divider, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart';
import type { Story, Project, StoryStatus } from '../lib/supabase';

interface Props {
  stories: Story[];
  projects: Project[];
  selectedProject: Project | null;
  onProjectChange: (project: Project | null) => void;
}

const STATUS_META: Record<StoryStatus, { label: string; color: string; light: string }> = {
  todo:        { label: 'To Do',       color: '#6B778C', light: '#f0f1f3' },
  in_progress: { label: 'In Progress', color: '#0052CC', light: '#e6eeff' },
  in_review:   { label: 'In Review',   color: '#FF8B00', light: '#fff4e0' },
  done:        { label: 'Done',         color: '#00875A', light: '#e3f9f0' },
};

const TYPE_COLORS: Record<string, string> = {
  story: '#0052CC',
  bug:   '#DE350B',
  task:  '#00875A',
  epic:  '#6554C0',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:      '#57D9A3',
  medium:   '#FF8B00',
  high:     '#DE350B',
  critical: '#6554C0',
};

/* ---- tiny SVG bar chart ---- */
function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 360, H = 140, barW = Math.min(40, (W / data.length) * 0.55), gap = W / data.length;

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} width="100%" style={{ overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * H;
        const x = gap * i + gap / 2 - barW / 2;
        const y = H - barH;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barW} height={barH} rx={4} fill={d.color} opacity={0.85} />
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={11} fill="#374151" fontWeight={600}>
                {d.value}
              </text>
            )}
            <text x={x + barW / 2} y={H + 18} textAnchor="middle" fontSize={10} fill="#6B7280">
              {d.label}
            </text>
          </g>
        );
      })}
      <line x1={0} y1={H} x2={W} y2={H} stroke="#e5e7eb" strokeWidth={1} />
    </svg>
  );
}

/* ---- tiny SVG donut chart ---- */
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>No data</Typography>;

  const R = 56, cx = 72, cy = 72, strokeW = 20;
  let cumAngle = -Math.PI / 2;

  const arcs = data.map((d) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(cumAngle);
    const y1 = cy + R * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + R * Math.cos(cumAngle);
    const y2 = cy + R * Math.sin(cumAngle);
    const large = angle > Math.PI ? 1 : 0;
    return { ...d, d: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <svg viewBox="0 0 144 144" width={120} height={120}>
        {arcs.filter((a) => a.value > 0).map((a) => (
          <path key={a.label} d={a.d} fill={a.color} opacity={0.88} />
        ))}
        <circle cx={cx} cy={cy} r={R - strokeW} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="#111827">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={9} fill="#6B7280">total</text>
      </svg>
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {arcs.map((a) => (
          <Box key={a.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: a.color, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary' }}>{a.label}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>{a.value}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 30 }}>({a.pct}%)</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

/* ---- horizontal stacked progress bar ---- */
function ProgressBar({ stories }: { stories: Story[] }) {
  const total = stories.length;
  if (total === 0) return null;
  const statuses: StoryStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

  return (
    <Box>
      <Box sx={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', mb: 1 }}>
        {statuses.map((s) => {
          const count = stories.filter((st) => st.status === s).length;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return <Box key={s} sx={{ width: `${pct}%`, bgcolor: STATUS_META[s].color, transition: 'width 0.4s' }} />;
        })}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
        {statuses.map((s) => {
          const count = stories.filter((st) => st.status === s).length;
          return (
            <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_META[s].color }} />
              <Typography variant="caption" color="text.secondary">{STATUS_META[s].label}: <b>{count}</b></Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

/* ---- stat card ---- */
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${color}`, flex: '1 1 140px', minWidth: 0 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{label}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  );
}

export default function ReportsView({ stories, projects, selectedProject, onProjectChange }: Props) {
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StoryStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return stories.filter((s) => {
      const matchName = !nameFilter || s.title.toLowerCase().includes(nameFilter.toLowerCase()) || (s.assignee && s.assignee.toLowerCase().includes(nameFilter.toLowerCase()));
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchName && matchStatus;
    });
  }, [stories, nameFilter, statusFilter]);

  const inProgress = filtered.filter((s) => s.status === 'in_progress');
  const completed = filtered.filter((s) => s.status === 'done');
  const totalPoints = filtered.reduce((sum, s) => sum + (s.story_points || 0), 0);
  const completedPoints = completed.reduce((sum, s) => sum + (s.story_points || 0), 0);

  const statusBarData = (['todo', 'in_progress', 'in_review', 'done'] as StoryStatus[]).map((s) => ({
    label: STATUS_META[s].label,
    value: filtered.filter((st) => st.status === s).length,
    color: STATUS_META[s].color,
  }));

  const typeBarData = ['story', 'bug', 'task', 'epic'].map((t) => ({
    label: t.charAt(0).toUpperCase() + t.slice(1),
    value: filtered.filter((st) => st.type === t).length,
    color: TYPE_COLORS[t],
  }));

  const priorityDonutData = ['low', 'medium', 'high', 'critical'].map((p) => ({
    label: p.charAt(0).toUpperCase() + p.slice(1),
    value: filtered.filter((st) => st.priority === p).length,
    color: PRIORITY_COLORS[p],
  }));

  const statusDonutData = (['todo', 'in_progress', 'in_review', 'done'] as StoryStatus[]).map((s) => ({
    label: STATUS_META[s].label,
    value: filtered.filter((st) => st.status === s).length,
    color: STATUS_META[s].color,
  }));

  const completionRate = filtered.length ? Math.round((completed.length / filtered.length) * 100) : 0;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <AssessmentIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1 }}>Reports</Typography>
          <Typography variant="caption" color="text.secondary">Activity overview and story analytics</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Project</InputLabel>
            <Select
              value={selectedProject?.id ?? 'all'}
              label="Project"
              onChange={(e) => {
                const found = projects.find((p) => p.id === e.target.value) ?? null;
                onProjectChange(found);
              }}
              sx={{ height: 36, fontSize: '0.85rem' }}
            >
              <MenuItem value="all">All Projects</MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            placeholder="Filter by name or assignee..."
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.secondary' }} /></InputAdornment>,
            }}
            sx={{ width: 240, '& .MuiOutlinedInput-root': { height: 36 } }}
          />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel sx={{ fontSize: '0.8rem' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value as StoryStatus | 'all')}
              sx={{ height: 36, fontSize: '0.85rem' }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="done">Completed</MenuItem>
              <MenuItem value="todo">To Do</MenuItem>
              <MenuItem value="in_review">In Review</MenuItem>
            </Select>
          </FormControl>

          {(nameFilter || statusFilter !== 'all') && (
            <Chip
              label="Clear filters"
              size="small"
              onDelete={() => { setNameFilter(''); setStatusFilter('all'); }}
              sx={{ height: 28 }}
            />
          )}

          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Showing <b>{filtered.length}</b> of <b>{stories.length}</b> stories
          </Typography>
        </Box>
      </Paper>

      {/* KPI row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard label="Total Stories" value={filtered.length} color="#0052CC" />
        <StatCard label="In Progress" value={inProgress.length} sub={`${filtered.length ? Math.round((inProgress.length / filtered.length) * 100) : 0}% of total`} color="#FF8B00" />
        <StatCard label="Completed" value={completed.length} sub={`${completionRate}% completion rate`} color="#00875A" />
        <StatCard label="Story Points" value={`${completedPoints}/${totalPoints}`} sub="completed / total" color="#6B778C" />
      </Box>

      {/* Overall progress */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <TrendingUpIcon sx={{ fontSize: 18, color: 'primary.main' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Overall Progress</Typography>
        </Box>
        <ProgressBar stories={filtered} />
      </Paper>

      {/* Charts row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {/* Stories by status bar */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: '1 1 320px', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StackedBarChartIcon sx={{ fontSize: 18, color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Stories by Status</Typography>
          </Box>
          <BarChart data={statusBarData} />
        </Paper>

        {/* Stories by type bar */}
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: '1 1 320px', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <StackedBarChartIcon sx={{ fontSize: 18, color: '#00875A' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Stories by Type</Typography>
          </Box>
          <BarChart data={typeBarData} />
        </Paper>
      </Box>

      {/* Donut charts row */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: '1 1 260px', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DonutLargeIcon sx={{ fontSize: 18, color: '#FF8B00' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Priority Breakdown</Typography>
          </Box>
          <DonutChart data={priorityDonutData} />
        </Paper>

        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, flex: '1 1 260px', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DonutLargeIcon sx={{ fontSize: 18, color: '#0052CC' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Status Distribution</Typography>
          </Box>
          <DonutChart data={statusDonutData} />
        </Paper>
      </Box>

      {/* Story list: In Progress + Completed */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <StoryTable title="In Progress" stories={inProgress} statusColor="#FF8B00" />
        <StoryTable title="Completed" stories={completed} statusColor="#00875A" />
      </Box>
    </Box>
  );
}

function StoryTable({ title, stories, statusColor }: { title: string; stories: Story[]; statusColor: string }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, flex: '1 1 340px', minWidth: 0, overflow: 'hidden' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: statusColor }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
        <Chip label={stories.length} size="small" sx={{ height: 18, '& .MuiChip-label': { px: '6px', fontSize: '0.65rem', fontWeight: 700 }, ml: 0.5 }} />
      </Box>
      {stories.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 3, textAlign: 'center' }}>No stories</Typography>
      ) : (
        <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
          {stories.map((s, i) => (
            <Box key={s.id}>
              {i > 0 && <Divider />}
              <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'flex-start', gap: 1.5, '&:hover': { bgcolor: 'grey.50' } }}>
                <Box
                  sx={{
                    mt: 0.25,
                    px: 0.75,
                    py: 0.1,
                    borderRadius: 0.5,
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    bgcolor: `${TYPE_COLORS[s.type]}18`,
                    color: TYPE_COLORS[s.type],
                    flexShrink: 0,
                  }}
                >
                  {s.type}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title}
                  </Typography>
                  {s.assignee && (
                    <Typography variant="caption" color="text.secondary">{s.assignee}</Typography>
                  )}
                </Box>
                {s.story_points > 0 && (
                  <Chip label={`${s.story_points}pt`} size="small" variant="outlined" sx={{ height: 18, '& .MuiChip-label': { px: '5px', fontSize: '0.62rem' }, flexShrink: 0 }} />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
