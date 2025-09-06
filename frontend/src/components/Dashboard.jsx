import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  TextField,
  Card,
  CardContent,
  CardActions,
  Chip,
  AppBar,
  Toolbar,
  Avatar,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { api } from '../contexts/AuthContext';
import Chart from 'chart.js/auto';

// Initialize dummy chart data for each board
const getDummyChartData = () => ({
  labels: ['To Do', 'In Progress', 'Done'],
  datasets: [{
    data: [Math.floor(Math.random() * 10) + 5, Math.floor(Math.random() * 10) + 5, Math.floor(Math.random() * 10) + 5],
    backgroundColor: ['#f7b7a3', '#d8e2dc', '#ffccbc'], // Soft coral, muted tea green, peach
    borderColor: '#4a3c31',
    borderWidth: 1,
  }],
});

// Store chart instances
const chartInstances = new Map();

const renderChart = (canvasId) => {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return;

  // Destroy existing chart instance if it exists
  if (chartInstances.has(canvasId)) {
    chartInstances.get(canvasId).destroy();
    chartInstances.delete(canvasId);
  }

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: getDummyChartData(),
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
      },
      cutout: '70%',
      animation: {
        animateScale: true,
        animateRotate: true,
      },
    },
  });

  chartInstances.set(canvasId, chart);
};

export default function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opened, setOpened] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [currentBoard, setCurrentBoard] = useState(null);
  const [editingBoard, setEditingBoard] = useState(null);
  const [editBoardTitle, setEditBoardTitle] = useState('');
  const [editBoardDescription, setEditBoardDescription] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const chartRenderRef = useRef(false); // Track if charts have been rendered

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/boards');
      setBoards(response.data);
    } catch (error) {
      console.error('Failed to fetch boards', error);
      toast.error('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    // Render charts for each board after loading
    if (!loading && boards.length > 0 && !chartRenderRef.current) {
      boards.forEach((board) => {
        renderChart(`chart-${board._id}`);
      });
      chartRenderRef.current = true; // Mark charts as rendered
    }

    // Cleanup on unmount
    return () => {
      chartInstances.forEach((chart) => chart.destroy());
      chartInstances.clear();
      chartRenderRef.current = false;
    };
  }, [boards, loading]);

  const createBoard = async () => {
    if (!newBoardTitle.trim()) {
      toast.error('Please enter a board title');
      return;
    }

    try {
      const response = await api.post('/api/boards', {
        title: newBoardTitle,
        description: newBoardDescription,
      });
      
      setBoards(prevBoards => [...prevBoards, response.data]);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setOpened(false);
      toast.success('Board created successfully');
      chartRenderRef.current = false; // Allow charts to re-render for new boards
    } catch (error) {
      console.error('Failed to create board', error);
      toast.error('Failed to create board');
    }
  };

  const editBoard = async () => {
    if (!editBoardTitle.trim()) {
      toast.error('Please enter a board title');
      return;
    }

    try {
      const response = await api.put(`/api/boards/${editingBoard._id}`, {
        title: editBoardTitle,
        description: editBoardDescription,
      });
      
      setBoards(prevBoards => 
        prevBoards.map(board => 
          board._id === editingBoard._id ? response.data : board
        )
      );
      setEditModalOpen(false);
      setEditingBoard(null);
      toast.success('Board updated successfully');
    } catch (error) {
      console.error('Failed to update board', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to update board');
    }
  };

  const deleteBoard = async (boardId) => {
    try {
      await api.delete(`/api/boards/${boardId}`);
      setBoards(prevBoards => prevBoards.filter(board => board._id !== boardId));
      setMenuAnchorEl(null);
      toast.success('Board deleted successfully');
      // Clean up chart instance
      const canvasId = `chart-${boardId}`;
      if (chartInstances.has(canvasId)) {
        chartInstances.get(canvasId).destroy();
        chartInstances.delete(canvasId);
      }
    } catch (error) {
      console.error('Failed to delete board', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to delete board');
    }
  };

  const handleMenuOpen = (event, board) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setCurrentBoard(board);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentBoard(null);
  };

  const handleEditClick = () => {
    if (currentBoard) {
      setEditingBoard(currentBoard);
      setEditBoardTitle(currentBoard.title);
      setEditBoardDescription(currentBoard.description || '');
      setEditModalOpen(true);
    }
    setMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.info('Logged out successfully');
  };

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #fff7f0 0%, #f9e6d9 100%)', minHeight: '100vh' }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(45deg, #f7b7a3, #ffccbc)', // Peach to soft coral
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <DashboardIcon sx={{ mr: 2, color: '#4a3c31' }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: '#4a3c31', 
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            Project Board
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: '#d8e2dc', // Muted tea green
                color: '#4a3c31',
                fontWeight: 'bold',
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#4a3c31',
                fontWeight: 'medium',
              }}
            >
              {user?.username}
            </Typography>
            <IconButton 
              sx={{ color: '#4a3c31' }} 
              onClick={handleLogout}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              color: '#4a3c31',
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            Your Boards
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpened(true)}
            sx={{
              backgroundColor: '#d8e2dc', // Muted tea green
              color: '#4a3c31',
              fontWeight: 'bold',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                backgroundColor: '#c8d4c9', // Darker tea green
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
              },
            }}
          >
            Create Board
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => (
              <Grid item key={index} xs={12} sm={6} md={4} lg={3}>
                <Card 
                  sx={{
                    background: 'linear-gradient(to bottom, #f9e6d9, #fff7f0)', // Peach-cream gradient
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    minWidth: 250,
                    maxWidth: 300,
                  }}
                >
                  <CardContent>
                    <Skeleton variant="text" width="60%" height={30} sx={{ bgcolor: 'rgba(255,245,240,0.5)' }} />
                    <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: 'rgba(255,245,240,0.5)' }} />
                    <Skeleton variant="rectangular" height={100} sx={{ mt: 1, bgcolor: 'rgba(255,245,240,0.5)' }} />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="circular" width={40} height={40} sx={{ bgcolor: 'rgba(255,245,240,0.5)' }} />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : boards.length === 0 ? (
          <Paper 
            sx={{
              p: 3,
              textAlign: 'center',
              background: 'linear-gradient(45deg, #f7b7a3, #ffccbc)', // Peach to soft coral
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
              minWidth: 250,
              maxWidth: 300,
              margin: 'auto',
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ color: '#4a3c31', fontWeight: 'bold' }}
            >
              No boards yet
            </Typography>
            <Typography 
              sx={{ mb: 2, color: '#4a3c31', opacity: 0.8 }}
            >
              You don't have any boards yet. Create your first board to get started!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpened(true)}
              sx={{
                backgroundColor: '#d8e2dc', // Muted tea green
                color: '#4a3c31',
                fontWeight: 'bold',
                borderRadius: 2,
                px: 3,
                '&:hover': {
                  backgroundColor: '#c8d4c9',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                },
              }}
            >
              Create Your First Board
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {boards.map((board) => (
              <Grid item key={board._id} xs={12} sm={6} md={4} lg={3}>
                <Card 
                  onClick={() => navigate(`/board/${board._id}`)}
                  sx={{
                    background: 'linear-gradient(to bottom, #f9e6d9, #fff7f0)', // Peach-cream gradient
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s ease',
                    minWidth: 250,
                    maxWidth: 300,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                      cursor: 'pointer',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ mb: 1 }}>
                      <Typography 
                        variant="overline" 
                        sx={{ color: '#4a3c31', opacity: 0.7, fontWeight: 'medium' }}
                      >
                        Title
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Tooltip title={board.title} placement="top">
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              color: '#4a3c31', 
                              fontWeight: 'bold',
                              textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '200px',
                            }}
                          >
                            {board.title}
                          </Typography>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, board)}
                          sx={{ color: '#4a3c31', mt: -0.5 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    {board.description && (
                      <>
                        <Typography 
                          variant="overline" 
                          sx={{ color: '#4a3c31', opacity: 0.7, fontWeight: 'medium' }}
                        >
                          Description
                        </Typography>
                        <Tooltip title={board.description} placement="top">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#4a3c31', 
                              opacity: 0.9,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              maxHeight: '4.5em',
                            }}
                          >
                            {board.description}
                          </Typography>
                        </Tooltip>
                      </>
                    )}
                    <Box sx={{ mt: 2, height: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <canvas id={`chart-${board._id}`} style={{ maxWidth: '100px', maxHeight: '100px' }}></canvas>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Chip
                      icon={<PersonIcon sx={{ color: '#4a3c31 !important' }} />}
                      label={board.createdBy?.username || 'Unknown'}
                      size="small"
                      variant="outlined"
                      sx={{
                        backgroundColor: 'rgba(255,245,240,0.5)', // Creamy peach
                        color: '#4a3c31',
                        borderColor: 'rgba(74,60,49,0.4)',
                        fontWeight: 'medium',
                        maxWidth: '150px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Create Board Modal */}
        <Modal open={opened} onClose={() => setOpened(false)}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            p: 3,
            bgcolor: '#fff7f0', // Creamy peach
            borderRadius: 2,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translate(-50%, -60%)' },
              '100%': { opacity: 1, transform: 'translate(-50%, -50%)' },
            },
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ color: '#4a3c31', fontWeight: 'bold' }}
            >
              Create New Board
            </Typography>
            <Typography 
              variant="overline" 
              sx={{ color: '#4a3c31', opacity: 0.7, fontWeight: 'medium' }}
            >
              Board Title
            </Typography>
            <TextField
              fullWidth
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              margin="normal"
              required
              placeholder="Enter board title"
              autoFocus
              sx={{
                '& .MuiInputBase-input': { color: '#4a3c31' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(74,60,49,0.4)' },
                  '&:hover fieldset': { borderColor: '#4a3c31' },
                  '&.Mui-focused fieldset': { borderColor: '#f7b7a3' }, // Soft coral
                },
              }}
            />
            <Typography 
              variant="overline" 
              sx={{ color: '#4a3c31', opacity: 0.7, fontWeight: 'medium' }}
            >
              Description
            </Typography>
            <TextField
              fullWidth
              value={newBoardDescription}
              onChange={(e) => setNewBoardDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              placeholder="Enter board description (optional)"
              sx={{
                '& .MuiInputBase-input': { color: '#4a3c31' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(74,60,49,0.4)' },
                  '&:hover fieldset': { borderColor: '#4a3c31' },
                  '&.Mui-focused fieldset': { borderColor: '#f7b7a3' },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined"
                onClick={() => setOpened(false)}
                sx={{ 
                  flex: 1,
                  color: '#4a3c31',
                  borderColor: 'rgba(74,60,49,0.4)',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#4a3c31',
                    backgroundColor: 'rgba(255,245,240,0.2)', // Creamy peach hover
                  },
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                onClick={createBoard}
                sx={{ 
                  flex: 1,
                  backgroundColor: '#d8e2dc', // Muted tea green
                  color: '#4a3c31',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#c8d4c9',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  },
                }}
                disabled={!newBoardTitle.trim()}
              >
                Create Board
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Edit Board Modal */}
        <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 400 },
            p: 3,
            bgcolor: '#fff7f0', // Creamy peach
            borderRadius: 2,
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translate(-50%, -60%)' },
              '100%': { opacity: 1, transform: 'translate(-50%, -50%)' },
            },
          }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ color: '#4a3c31', fontWeight: 'bold' }}
            >
              Edit Board
            </Typography>
            <Typography 
              variant="overline" 
              sx={{ color: '#4a3c31', opacity: 0.7, fontWeight: 'medium' }}
            >
              Board Title
            </Typography>
            <TextField
              fullWidth
              value={editBoardTitle}
              onChange={(e) => setEditBoardTitle(e.target.value)}
              margin="normal"
              required
              autoFocus
              sx={{
                '& .MuiInputBase-input': { color: '#4a3c31' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(74,60,49,0.4)' },
                  '&:hover fieldset': { borderColor: '#4a3c31' },
                  '&.Mui-focused fieldset': { borderColor: '#f7b7a3' },
                },
              }}
            />
            <Typography 
              variant="overline" 
              sx={{ color: '#4a3c31', opacity: 0.7, fontWeight: 'medium' }}
            >
              Description
            </Typography>
            <TextField
              fullWidth
              value={editBoardDescription}
              onChange={(e) => setEditBoardDescription(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              sx={{
                '& .MuiInputBase-input': { color: '#4a3c31' },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'rgba(74,60,49,0.4)' },
                  '&:hover fieldset': { borderColor: '#4a3c31' },
                  '&.Mui-focused fieldset': { borderColor: '#f7b7a3' },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button 
                variant="outlined"
                onClick={() => setEditModalOpen(false)}
                sx={{ 
                  flex: 1,
                  color: '#4a3c31',
                  borderColor: 'rgba(74,60,49,0.4)',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#4a3c31',
                    backgroundColor: 'rgba(255,245,240,0.2)',
                  },
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                onClick={editBoard}
                sx={{ 
                  flex: 1,
                  backgroundColor: '#d8e2dc', // Muted tea green
                  color: '#4a3c31',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: '#c8d4c9',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                  },
                }}
                disabled={!editBoardTitle.trim()}
              >
                Update Board
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Board Options Menu */}
        <Menu
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleMenuClose}
          transitionDuration={150}
          PaperProps={{
            sx: {
              bgcolor: '#fff7f0', // Creamy peach
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            },
          }}
        >
          <MenuItem 
            onClick={handleEditClick}
            sx={{ color: '#4a3c31', '&:hover': { bgcolor: 'rgba(255,245,240,0.3)' } }}
          >
            <EditIcon sx={{ mr: 1, color: '#4a3c31' }} /> Edit
          </MenuItem>
          <MenuItem 
            onClick={() => {
              deleteBoard(currentBoard?._id);
              handleMenuClose();
            }}
            sx={{ color: '#4a3c31', '&:hover': { bgcolor: 'rgba(255,245,240,0.3)' } }}
          >
            <DeleteIcon sx={{ mr: 1, color: '#4a3c31' }} /> Delete
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
}