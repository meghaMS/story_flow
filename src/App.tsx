import { useEffect, useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box, AppBar, Toolbar, Typography, Button, IconButton,
  Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Divider, Chip, Avatar, Tooltip, TextField,
  InputAdornment, Select, MenuItem, FormControl, InputLabel,
  Badge, Skeleton, Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import RefreshIcon from '@mui/icons-material/Refresh';
import { theme } from './theme';
import { supabase } from './lib/supabase';
import type { Story, Project, Member, StoryStatus, StoryType, StoryPriority } from './lib/supabase';
import BoardColumn from './components/BoardColumn';
import StoryCard from './components/StoryCard';
import StoryDetailDialog from './components/StoryDetailDialog';
import CreateStoryDialog from './components/CreateStoryDialog';
import CreateProjectDialog from './components/CreateProjectDialog';
import DataManagementDialog from './components/DataManagementDialog';
import ReportsView from './components/ReportsView';
import MembersDialog from './components/MembersDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';

const DRAWER_WIDTH = 240;

const COLUMNS: { status: StoryStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: '#6B778C' },
  { status: 'in_progress', label: 'In Progress', color: '#0052CC' },
  { status: 'in_review', label: 'In Review', color: '#FF8B00' },
  { status: 'done', label: 'Done', color: '#00875A' },
];

type ViewMode = 'board' | 'list' | 'reports';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingStories, setLoadingStories] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<StoryType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<StoryPriority | 'all'>('all');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [createStoryOpen, setCreateStoryOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [dataManagementOpen, setDataManagementOpen] = useState(false);
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [reportProject, setReportProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadStories(selectedProject.id);
      loadMembers(selectedProject.id);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (viewMode === 'reports') loadReportStories(reportProject?.id ?? null);
  }, [viewMode, reportProject]);

  const loadProjects = async () => {
    setLoadingProjects(true);
    try {
      const { data, error: err } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true });
      if (err) throw err;
      const list = (data ?? []) as Project[];
      setProjects(list);
      if (list.length > 0) setSelectedProject(list[0]);
    } catch {
      setError('Failed to load projects.');
    } finally {
      setLoadingProjects(false);
    }
  };

  const loadMembers = async (projectId: string) => {
    try {
      const { data, error: err } = await supabase
        .from('members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setMembers((data ?? []) as Member[]);
    } catch {
      // non-critical — silently fail
    }
  };

  const loadReportStories = async (projectId: string | null) => {
    try {
      let query = supabase.from('stories').select('*').order('created_at', { ascending: true });
      if (projectId) query = query.eq('project_id', projectId);
      const { data, error: err } = await query;
      if (err) throw err;
      setAllStories((data ?? []) as Story[]);
    } catch {
      setError('Failed to load report data.');
    }
  };

  const loadStories = async (projectId: string) => {
    setLoadingStories(true);
    try {
      const { data, error: err } = await supabase
        .from('stories')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });
      if (err) throw err;
      setStories((data ?? []) as Story[]);
    } catch {
      setError('Failed to load stories.');
    } finally {
      setLoadingStories(false);
    }
  };

  const filteredStories = useMemo(() => {
    return stories.filter((s) => {
      const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || s.type === filterType;
      const matchesPriority = filterPriority === 'all' || s.priority === filterPriority;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [stories, search, filterType, filterPriority]);

  const storiesByStatus = useMemo(() => {
    const map: Record<StoryStatus, Story[]> = { todo: [], in_progress: [], in_review: [], done: [] };
    filteredStories.forEach((s) => { if (map[s.status]) map[s.status].push(s); });
    return map;
  }, [filteredStories]);

  const stats = useMemo(() => ({
    total: stories.length,
    done: stories.filter((s) => s.status === 'done').length,
    totalPoints: stories.reduce((sum, s) => sum + (s.story_points || 0), 0),
  }), [stories]);

  const handleStoryCreated = (story: Story) => setStories((prev) => [...prev, story]);

  const handleStoryUpdated = (updated: Story) => {
    setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (selectedStory?.id === updated.id) setSelectedStory(updated);
  };

  const handleStoryDeleted = (id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
    if (selectedStory?.id === id) setSelectedStory(null);
  };

  const handleProjectCreated = (project: Project) => {
    setProjects((prev) => [...prev, project]);
    setSelectedProject(project);
    setStories([]);
  };

  const handleStoryMoved = (storyId: string, newStatus: StoryStatus) => {
    setStories((prev) => prev.map((s) => s.id === storyId ? { ...s, status: newStatus } : s));
  };

  const handleStoriesCleared = () => setStories([]);

  const handleAllDataCleared = () => {
    setStories([]);
    setProjects([]);
    setSelectedProject(null);
  };

  const selectedStoryIndex = selectedStory ? stories.findIndex((s) => s.id === selectedStory.id) : -1;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        {/* Sidebar */}
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              bgcolor: '#0747A6',
              color: 'white',
              borderRight: 'none',
            },
          }}
        >
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: '#2684FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ViewKanbanIcon sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white', letterSpacing: -0.5 }}>
              StoryFlow
            </Typography>
          </Box>

          <Box sx={{ p: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', pl: 1, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
              Navigation
            </Typography>
            <List dense sx={{ mt: 0.5 }}>
              {[
                { label: 'Board',   icon: <DashboardIcon sx={{ fontSize: 18 }} />, mode: 'board'   as ViewMode },
                { label: 'Backlog', icon: <ListAltIcon   sx={{ fontSize: 18 }} />, mode: 'list'    as ViewMode },
                { label: 'Reports', icon: <BarChartIcon  sx={{ fontSize: 18 }} />, mode: 'reports' as ViewMode },
              ].map(({ label, icon, mode }) => (
                <ListItem key={mode} disablePadding>
                  <ListItemButton
                    selected={viewMode === mode}
                    onClick={() => setViewMode(mode)}
                    sx={{
                      borderRadius: 1,
                      color: 'rgba(255,255,255,0.85)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                      '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.18)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{icon}</ListItemIcon>
                    <ListItemText primary={label} primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>

          {selectedProject && (
            <Box sx={{ px: 1.5, pb: 1 }}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setMembersDialogOpen(true)}
                  sx={{ borderRadius: 1, color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}><PeopleIcon sx={{ fontSize: 18 }} /></ListItemIcon>
                  <ListItemText primary="Members" primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 500 }} />
                </ListItemButton>
              </ListItem>
            </Box>
          )}

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', mx: 1.5 }} />

          <Box sx={{ p: 1.5, flex: 1, overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pl: 1, mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                Projects
              </Typography>
              <Tooltip title="New Project">
                <IconButton size="small" onClick={() => setCreateProjectOpen(true)} sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}>
                  <AddIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>

            {loadingProjects ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="rounded" height={36} sx={{ mb: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }} />
              ))
            ) : (
              <List dense>
                {projects.map((project) => (
                  <ListItem key={project.id} disablePadding>
                    <ListItemButton
                      selected={selectedProject?.id === project.id}
                      onClick={() => setSelectedProject(project)}
                      sx={{
                        borderRadius: 1,
                        color: 'rgba(255,255,255,0.85)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                        '&.Mui-selected': { bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#2684FF', fontWeight: 700 }}>
                          {project.key.slice(0, 2)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={project.name}
                        secondary={project.key}
                        primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500, noWrap: true }}
                        secondaryTypographyProps={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)' }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#36B37E', fontSize: '0.75rem' }}>U</Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: 'white', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>Demo User</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.65rem' }}>user@demo.com</Typography>
              </Box>
            </Box>
          </Box>
        </Drawer>

        {/* Main content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <AppBar position="static" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
            <Toolbar sx={{ gap: 1, minHeight: '52px !important' }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FolderSpecialIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  {selectedProject?.name ?? 'Select a project'}
                </Typography>
                {selectedProject && (
                  <Chip label={selectedProject.key} size="small" sx={{ height: 18, '& .MuiChip-label': { px: '6px', fontSize: '0.65rem', fontWeight: 700 }, bgcolor: 'primary.main', color: 'white' }} />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {selectedProject && viewMode !== 'reports' && (
                  <Box sx={{ display: 'flex', gap: 1, mr: 1 }}>
                    <Chip label={`${stats.total} stories`} size="small" variant="outlined" sx={{ height: 24 }} />
                    <Chip label={`${stats.done}/${stats.total} done`} size="small" color="success" variant="outlined" sx={{ height: 24 }} />
                    <Chip label={`${stats.totalPoints} pts`} size="small" color="primary" variant="outlined" sx={{ height: 24 }} />
                  </Box>
                )}

                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={() => selectedProject && loadStories(selectedProject.id)}>
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Data Management">
                  <IconButton size="small" onClick={() => setDataManagementOpen(true)}>
                    <SettingsIcon fontSize="small" />
                  </IconButton>
                </Tooltip>

                <IconButton size="small">
                  <Badge badgeContent={0} color="error">
                    <NotificationsNoneIcon fontSize="small" />
                  </Badge>
                </IconButton>

                {selectedProject && viewMode !== 'reports' && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateStoryOpen(true)}
                    sx={{ ml: 1 }}
                  >
                    Create Story
                  </Button>
                )}
              </Box>
            </Toolbar>
          </AppBar>

          {selectedProject && viewMode !== 'reports' && (
            <Box sx={{ px: 3, py: 1.5, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search stories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} /></InputAdornment>,
                }}
                sx={{ width: 240, '& .MuiOutlinedInput-root': { height: 32 } }}
              />

              <FilterListIcon sx={{ fontSize: 16, color: 'text.secondary' }} />

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel sx={{ fontSize: '0.8rem' }}>Type</InputLabel>
                <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value as StoryType | 'all')} sx={{ height: 32, fontSize: '0.8rem' }}>
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="story">Story</MenuItem>
                  <MenuItem value="bug">Bug</MenuItem>
                  <MenuItem value="task">Task</MenuItem>
                  <MenuItem value="epic">Epic</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel sx={{ fontSize: '0.8rem' }}>Priority</InputLabel>
                <Select value={filterPriority} label="Priority" onChange={(e) => setFilterPriority(e.target.value as StoryPriority | 'all')} sx={{ height: 32, fontSize: '0.8rem' }}>
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>

              <Box sx={{ flex: 1 }} />

              <Box sx={{ display: 'flex', border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                <Tooltip title="Board View">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('board')}
                    sx={{ borderRadius: 0, bgcolor: viewMode === 'board' ? 'primary.main' : 'transparent', color: viewMode === 'board' ? 'white' : 'text.secondary', '&:hover': { bgcolor: viewMode === 'board' ? 'primary.dark' : 'action.hover' }, px: 1 }}
                  >
                    <ViewKanbanIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="List View">
                  <IconButton
                    size="small"
                    onClick={() => setViewMode('list')}
                    sx={{ borderRadius: 0, bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent', color: viewMode === 'list' ? 'white' : 'text.secondary', '&:hover': { bgcolor: viewMode === 'list' ? 'primary.dark' : 'action.hover' }, px: 1 }}
                  >
                    <ListAltIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>
            )}

            {viewMode === 'reports' ? (
              <ReportsView
                stories={allStories}
                projects={projects}
                selectedProject={reportProject}
                onProjectChange={(p) => setReportProject(p)}
              />
            ) : !selectedProject ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
                <AutoAwesomeIcon sx={{ fontSize: 64, color: 'primary.light', opacity: 0.5 }} />
                <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 600 }}>Welcome to StoryFlow</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Create a project to get started</Typography>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateProjectOpen(true)}>
                  Create Project
                </Button>
              </Box>
            ) : viewMode === 'board' ? (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', overflowX: 'auto', pb: 2 }}>
                {COLUMNS.map((col) => (
                  <BoardColumn
                    key={col.status}
                    title={col.label}
                    status={col.status}
                    color={col.color}
                    stories={storiesByStatus[col.status]}
                    projectKey={selectedProject.key}
                    allStories={stories}
                    loading={loadingStories}
                    onStoryClick={(s) => setSelectedStory(s)}
                    onStoryMoved={handleStoryMoved}
                  />
                ))}
              </Box>
            ) : (
              <Box sx={{ maxWidth: 960, mx: 'auto' }}>
                {loadingStories ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="rounded" height={70} sx={{ mb: 1 }} />
                  ))
                ) : filteredStories.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <ListAltIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3 }} />
                    <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
                      {search || filterType !== 'all' || filterPriority !== 'all'
                        ? 'No stories match your filters'
                        : 'No stories yet. Create one to get started!'}
                    </Typography>
                  </Box>
                ) : (
                  filteredStories.map((story) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      projectKey={selectedProject.key}
                      index={stories.findIndex((s) => s.id === story.id)}
                      onClick={() => setSelectedStory(story)}
                    />
                  ))
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {selectedProject && (
        <CreateStoryDialog
          open={createStoryOpen}
          onClose={() => setCreateStoryOpen(false)}
          projectId={selectedProject.id}
          members={members}
          onCreated={handleStoryCreated}
        />
      )}

      <CreateProjectDialog
        open={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onCreated={handleProjectCreated}
      />

      <StoryDetailDialog
        open={!!selectedStory}
        story={selectedStory}
        projectKey={selectedProject?.key ?? ''}
        storyIndex={selectedStoryIndex}
        members={members}
        onClose={() => setSelectedStory(null)}
        onUpdated={handleStoryUpdated}
        onDeleted={handleStoryDeleted}
      />

      <DataManagementDialog
        open={dataManagementOpen}
        onClose={() => setDataManagementOpen(false)}
        projectId={selectedProject?.id ?? null}
        onStoriesCleared={handleStoriesCleared}
        onAllDataCleared={handleAllDataCleared}
      />

      <MembersDialog
        open={membersDialogOpen}
        onClose={() => setMembersDialogOpen(false)}
        project={selectedProject}
        members={members}
        onMembersChanged={setMembers}
      />
    </ThemeProvider>
  );
}
