import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Paper,
  TextField,
  Modal,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem
} from '@mui/material';
import {
  ArrowBack,
  Add,
  MoreVert,
  Edit,
  Delete,
  DragIndicator,
  Person,
  Label
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { api } from '../contexts/AuthContext';

// Color palette
const COLORS = {
  primary: '#5c6bc0',
  secondary: '#ff7043',
  accent: '#26a69a',
  background: '#f5f5f5',
  listHeader: '#7e57c2',
  cardBackground: '#ffffff',
  text: '#333333',
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  info: '#29b6f6'
};

// Styled components for drag-and-drop
const DraggableList = styled(Paper)(({ theme }) => ({
  minWidth: 300,
  maxWidth: 300,
  minHeight: 400,
  backgroundColor: '#e8eaf6',
  marginRight: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(1.5),
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
  },
}));

const DraggableCard = styled(Card)(({ theme, priority }) => {
  let borderColor = 'transparent';
  let bgColor = COLORS.cardBackground;
  
  switch (priority) {
    case 'low':
      borderColor = COLORS.info;
      bgColor = '#e1f5fe';
      break;
    case 'medium':
      borderColor = COLORS.warning;
      bgColor = '#fff3e0';
      break;
    case 'high':
      borderColor = COLORS.error;
      bgColor = '#ffebee';
      break;
    case 'critical':
      borderColor = '#d32f2f';
      bgColor = '#ffcdd2';
      break;
    default:
      break;
  }
  
  return {
    marginBottom: theme.spacing(1.5),
    cursor: 'pointer',
    borderRadius: theme.spacing(1),
    borderLeft: `5px solid ${borderColor}`,
    backgroundColor: bgColor,
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  };
});

const DragHandle = styled('div')({
  cursor: 'grab',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  color: COLORS.primary,
});

export default function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [newListTitle, setNewListTitle] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState('medium');
  const [openedListModal, setOpenedListModal] = useState(false);
  const [openedCardModal, setOpenedCardModal] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [listMenuAnchor, setListMenuAnchor] = useState(null);
  const [currentListId, setCurrentListId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [listToDelete, setListToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editListModalOpen, setEditListModalOpen] = useState(false);
  const [editListId, setEditListId] = useState(null);
  const [editListTitle, setEditListTitle] = useState('');
  const [cardMenuAnchor, setCardMenuAnchor] = useState(null);
  const [currentCard, setCurrentCard] = useState(null);
  const [editCardModalOpen, setEditCardModalOpen] = useState(false);
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardPriority, setEditCardPriority] = useState('medium');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardDueDate, setEditCardDueDate] = useState('');
  const [editCardLabels, setEditCardLabels] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);


  useEffect(() => {
    fetchBoardData();
  }, [id]);

  const fetchBoardData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchBoard(), fetchLists()]);
    } catch (error) {
      setError('Failed to fetch board data');
      console.error('Failed to fetch board data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBoard = async () => {
    try {
      const response = await api.get(`/api/boards/${id}`);
      setBoard(response.data);
    } catch (error) {
      setError('Failed to fetch board');
      console.error('Failed to fetch board', error);
    }
  };

  const fetchLists = async () => {
    try {
      const response = await api.get(`/api/boards/${id}/lists`);
      setLists(response.data);
    } catch (error) {
      setError('Failed to fetch lists');
      console.error('Failed to fetch lists', error);
    }
  };

  const createList = async () => {
    if (!newListTitle.trim()) return;

    try {
      const response = await api.post(`/api/boards/${id}/lists`, {
        title: newListTitle,
      });
      
      setLists([...lists, response.data]);
      setNewListTitle('');
      setOpenedListModal(false);
      setSuccess('List created successfully');
    } catch (error) {
      setError('Failed to create list');
      console.error('Failed to create list', error);
    }
  };

  const createCard = async () => {
    if (!newCardTitle.trim() || !selectedList) return;

    try {
      const response = await api.post(`/api/lists/${selectedList._id}/cards`, {
        title: newCardTitle,
        priority: newCardPriority,
      });
      
      // Update the list with the new card
      const updatedLists = lists.map(list => {
        if (list._id === selectedList._id) {
          return { 
            ...list, 
            cards: [...(list.cards || []), response.data] 
          };
        }
        return list;
      });
      
      setLists(updatedLists);
      setNewCardTitle('');
      setNewCardPriority('medium');
      setOpenedCardModal(false);
      setSuccess('Card created successfully');
    } catch (error) {
      setError('Failed to create card');
      console.error('Failed to create card', error);
    }
  };

  const updateCard = async () => {
    if (!currentCard) {
      setError('No card selected');
      return;
    }
    if (!editCardTitle.trim()) {
      setError('Card title is required');
      return;
    }

    try {
      const labelsArray = editCardLabels
        ? editCardLabels.split(',').map(label => label.trim()).filter(label => label)
        : [];

      await api.put(`/api/cards/${currentCard._id}`, {
        title: editCardTitle.trim(),
        priority: editCardPriority,
        description: editCardDescription,
        dueDate: editCardDueDate || null,
        labels: labelsArray
      });

      // update local state
      const updatedLists = lists.map(list => ({
        ...list,
        cards: list.cards
          ? list.cards.map(card =>
              card._id === currentCard._id
                ? {
                    ...card,
                    title: editCardTitle.trim(),
                    priority: editCardPriority,
                    description: editCardDescription,
                    dueDate: editCardDueDate,
                    labels: labelsArray
                  }
                : card
            )
          : []
      }));

      setLists(updatedLists);
      setEditCardModalOpen(false);

      // reset
      setCurrentCard(null);
      setEditCardTitle('');
      setEditCardPriority('medium');
      setEditCardDescription('');
      setEditCardDueDate('');
      setEditCardLabels('');
      setSuccess('Card updated successfully');
    } catch (error) {
      const errorCode = error.response?.data?.code;
      let errorMessage = 'Failed to update card';
      switch (errorCode) {
        case 'MISSING_TITLE':
          errorMessage = 'Card title is required';
          break;
        case 'CARD_NOT_FOUND':
          errorMessage = 'Card not found';
          break;
        case 'LIST_NOT_FOUND':
          errorMessage = 'List not found';
          break;
        case 'BOARD_NOT_FOUND':
          errorMessage = 'Board not found';
          break;
        case 'ACCESS_DENIED':
          errorMessage = 'You do not have permission to update this card';
          break;
        case 'SERVER_ERROR':
          errorMessage = 'An unexpected error occurred';
          break;
        default:
          errorMessage = error.response?.data?.error || 'Failed to update card';
      }
      setError(errorMessage);
      console.error('Failed to update card', error.response?.data || error);
    }
  };

  const deleteList = async () => {
    if (!listToDelete) return;
    
    try {
      await api.delete(`/api/lists/${listToDelete}`);
      
      // Update local state
      const updatedLists = lists.filter(list => list._id !== listToDelete);
      setLists(updatedLists);
      setDeleteConfirmOpen(false);
      setListMenuAnchor(null);
      setSuccess('List deleted successfully');
    } catch (error) {
      setError('Failed to delete list');
      console.error('Failed to delete list', error);
    }
  };

  const deleteCard = async () => {
    if (!currentCard) return;
    
    try {
      await api.delete(`/api/cards/${currentCard._id}`);
      
      // Update local state
      const updatedLists = lists.map(list => {
        if (list.cards) {
          return { 
            ...list, 
            cards: list.cards.filter(card => card._id !== currentCard._id) 
          };
        }
        return list;
      });
      
      setLists(updatedLists);
      setCardMenuAnchor(null);
      setCurrentCard(null);
      setSuccess('Card deleted successfully');
    } catch (error) {
      setError('Failed to delete card');
      console.error('Failed to delete card', error);
    }
  };

  const handleListMenuOpen = (event, listId) => {
    setListMenuAnchor(event.currentTarget);
    setCurrentListId(listId);
  };

  const handleListMenuClose = () => {
    setListMenuAnchor(null);
    setCurrentListId(null);
  };

  const handleCardMenuOpen = (event, card) => {
    event.stopPropagation();
    setCardMenuAnchor(event.currentTarget);
    setCurrentCard(card);
  };

  const handleOpenEditCardModal = (card) => {
    setCurrentCard(card);
    setEditCardTitle(card.title || '');
    setEditCardDescription(card.description || '');
    setEditCardPriority(card.priority || 'medium');
    setEditCardDueDate(card.dueDate || '');
    setEditCardLabels(card.labels ? card.labels.join(', ') : '');
    setEditCardModalOpen(true);
  };

  const handleCardMenuClose = () => {
    setCardMenuAnchor(null);
    setCurrentCard(null);
  };

  const handleDeleteClick = () => {
    setListToDelete(currentListId);
    setDeleteConfirmOpen(true);
    handleListMenuClose();
  };

  const handleEditClick = () => {
    const list = lists.find(l => l._id === currentListId);
    if (list) {
      setEditListId(currentListId);
      setEditListTitle(list.title);
      setEditListModalOpen(true);
    }
    handleListMenuClose();
  };

  const handleEditCardClick = () => {
    if (currentCard) {
      setEditCardTitle(currentCard.title);
      setEditCardPriority(currentCard.priority || 'medium');
      setEditCardModalOpen(true);
    }
    handleCardMenuClose();
  };

  const handleDeleteCardClick = () => {
    deleteCard();
  };

  const handleEditList = async () => {
    if (!editListTitle.trim() || !editListId) return;

    try {
      const response = await api.put(`/api/lists/${editListId}`, {
        title: editListTitle,
      });
      
      // Update the local state
      const updatedLists = lists.map(list => {
        if (list._id === editListId) {
          return { ...list, title: response.data.title };
        }
        return list;
      });
      
      setLists(updatedLists);
      setEditListModalOpen(false);
      setEditListId(null);
      setEditListTitle('');
      setSuccess('List updated successfully');
    } catch (error) {
      setError('Failed to update list: ' + (error.response?.data?.message || error.message));
      console.error('Failed to update list', error.response?.data || error);
    }
  };

  const handleDragStart = (e, itemId, type, sourceListId = null) => {
    setDraggedItem(itemId);
    setDraggedItemType(type);
    e.dataTransfer.setData('itemId', itemId);
    e.dataTransfer.setData('type', type);
    if (sourceListId) {
      e.dataTransfer.setData('sourceListId', sourceListId);
    }
    e.dataTransfer.effectAllowed = 'move';
  };


  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetListId, targetIndex) => {
    e.preventDefault();
    
    const draggedItemId = e.dataTransfer.getData('itemId');
    const type = e.dataTransfer.getData('type');
    
    if (type === 'card') {
      // Handle card drop
      const sourceListId = e.dataTransfer.getData('sourceListId');
      
      if (sourceListId === targetListId) {
        const list = lists.find(l => l._id === sourceListId);
        const cardIndex = list.cards.findIndex(c => c._id === draggedItemId);
        
        if (cardIndex !== targetIndex) {
          const newCards = [...list.cards];
          const [movedCard] = newCards.splice(cardIndex, 1);
          newCards.splice(targetIndex, 0, movedCard);
          
          const updatedLists = lists.map(l => {
            if (l._id === sourceListId) {
              return { ...l, cards: newCards };
            }
            return l;
          });
          setLists(updatedLists);
          
          try {
            await api.put(`/api/cards/${draggedItemId}/move`, {
              listId: targetListId,
              position: targetIndex
            });
          } catch (error) {
            setError('Failed to update card position: ' + (error.response?.data?.message || error.message));
            console.error('Failed to update card position', error.response?.data || error);
            setLists(lists); // Revert state
          }
        }
      } else {
        const sourceList = lists.find(l => l._id === sourceListId);
        const targetList = lists.find(l => l._id === targetListId);
        const cardIndex = sourceList.cards.findIndex(c => c._id === draggedItemId);
        
        const movedCard = sourceList.cards[cardIndex];
        
        const updatedLists = lists.map(l => {
          if (l._id === sourceListId) {
            return { ...l, cards: l.cards.filter(c => c._id !== draggedItemId) };
          }
          if (l._id === targetListId) {
            const newCards = [...(l.cards || [])];
            newCards.splice(targetIndex, 0, movedCard);
            return { ...l, cards: newCards };
          }
          return l;
        });
        setLists(updatedLists);
        
        try {
          await api.put(`/api/cards/${draggedItemId}/move`, {
            listId: targetListId,
            position: targetIndex
          });
        } catch (error) {
          setError('Failed to move card: ' + (error.response?.data?.message || error.message));
          console.error('Failed to move card', error.response?.data || error);
          setLists(lists); // Revert state
        }
      }
    } else if (type === 'list') {
      const listIndex = lists.findIndex(l => l._id === draggedItemId);
      
      if (listIndex !== targetIndex && targetIndex >= 0 && targetIndex < lists.length) {
        try {
          await api.put(`/api/lists/${draggedItemId}/move`, {
            boardId: id,
            position: targetIndex
          });
          const newLists = [...lists];
          const [movedList] = newLists.splice(listIndex, 1);
          newLists.splice(targetIndex, 0, movedList);
          setLists(newLists);
        } catch (error) {
          setError('Failed to update list position: ' + (error.response?.data?.message || error.message));
          console.error('Failed to update list position', error.response?.data || error);
        }
      }
    }
    
    setDraggedItem(null);
    setDraggedItemType(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
      case 'critical': return 'Critical';
      default: return 'None';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ 
        py: 3, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '80vh',
        background: 'linear-gradient(135deg, #fff7f0 0%, #f9e6d9 50%, #f7b7a3 100%)', // Peach-cream to soft coral gradient
      }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 2,
          p: 3,
          borderRadius: 3,
          background: 'rgba(255,245,240,0.3)', // Creamy peach overlay
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%': { transform: 'scale(1)', opacity: 0.8 },
            '50%': { transform: 'scale(1.05)', opacity: 1 },
            '100%': { transform: 'scale(1)', opacity: 0.8 },
          },
        }}>
          <CircularProgress 
            sx={{ 
              color: '#f7b7a3', // Soft coral
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
                animation: 'spin 1.5s linear infinite',
              },
            }} 
          />
          <Typography 
            variant="h6" 
            sx={{ 
              color: '#4a3c31', // Dark tea brown
              fontWeight: 'bold',
              textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            Crafting Something Beautiful...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (!board) {
    return (
      <Container maxWidth="xl" sx={{ 
        py: 3,
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        minHeight: '100vh'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Failed to load board
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')} sx={{
            backgroundColor: COLORS.primary,
            '&:hover': { backgroundColor: COLORS.secondary }
          }}>
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  return (
      
      <Container maxWidth="xl" sx={{ 
        py: 2,
        background: 'linear-gradient(135deg, #fff7f0 0%, #f9e6d9 100%)', // Peach-cream gradient
        minHeight: '100vh'
      }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(45deg, #ffccbc, #f7b7a3)', // Peach to soft coral
            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
            color: '#4a3c31', // Dark tea brown for text
          }}
        >
          {/* Left Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
            <IconButton onClick={() => navigate("/")} sx={{ color: '#4a3c31' }}>
              <ArrowBack />
            </IconButton>
            <Typography
              variant="h5"
              component="h1"
              fontWeight="bold"
              sx={{
                fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                wordBreak: "break-word",
                textShadow: '1px 1px 2px rgba(0,0,0,0.15)',
                color: '#4a3c31',
              }}
            >
              {board.title}
            </Typography>
          </Box>

          {/* Right Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              icon={<Person />}
              label={board.createdBy?.username}
              variant="outlined"
              sx={{
                maxWidth: { xs: "120px", sm: "160px" },
                overflow: "hidden",
                textOverflow: "ellipsis",
                backgroundColor: 'rgba(255,245,240,0.5)', // Creamy peach
                color: '#4a3c31',
                borderColor: 'rgba(74,60,49,0.4)',
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenedListModal(true)}
              sx={{
                whiteSpace: "nowrap",
                px: { xs: 1.5, sm: 2 },
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                backgroundColor: '#d8e2dc', // Muted tea green
                color: '#4a3c31',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#c8d4c9', // Slightly darker tea green
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                },
              }}
            >
              Add List
            </Button>
          </Box>
        </Box>

        <Box sx={{ 
          display: 'flex', 
          overflowX: 'auto', 
          minHeight: '500px', 
          alignItems: 'flex-start',
          pb: 1,
        }}>
          {lists.map((list, listIndex) => (
            <DraggableList
              key={list._id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, list._id, listIndex)}
              elevation={2}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  p: 2,
                  cursor: 'move',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                  background: 'linear-gradient(45deg, #f7b7a3, #ffccbc)', // Soft coral to peach
                  color: '#4a3c31',
                }}
                draggable
                onDragStart={(e) => handleDragStart(e, list._id, 'list')}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DragHandle>
                    <DragIndicator fontSize="small" sx={{ color: '#4a3c31' }} />
                  </DragHandle>
                  <Typography variant="h6" sx={{ ml: 1, fontWeight: 'bold', color: '#4a3c31' }}>
                    {list.title}
                  </Typography>
                  <Chip 
                    label={list.cards ? list.cards.length : 0} 
                    size="small" 
                    sx={{ 
                      ml: 1, 
                      backgroundColor: 'rgba(255,245,240,0.5)', // Creamy peach
                      color: '#4a3c31',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
                <IconButton 
                  size="small" 
                  sx={{ color: '#4a3c31' }}
                  onClick={(e) => handleListMenuOpen(e, list._id)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
              
              <Box 
                sx={{ 
                  p: 1.5, 
                  minHeight: 300, 
                  maxHeight: 500, 
                  overflowY: 'auto',
                  background: 'linear-gradient(to bottom, #f9e6d9, #fff7f0)', // Peach-cream gradient
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, list._id, list.cards ? list.cards.length : 0)}
              >
                {list.cards && list.cards.map((card, cardIndex) => (
                  <DraggableCard
                    key={card._id}
                    draggable
                    priority={card.priority}
                    onDragStart={(e) => {
                      handleDragStart(e, card._id, 'card', list._id);
                    }}
                    onDragOver={handleDragOver}
                    elevation={1}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography sx={{ flexGrow: 1, mr: 1, fontWeight: '500', color: '#4a3c31' }}>
                          {card.title}
                        </Typography>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleCardMenuOpen(e, card)}
                          sx={{ color: '#4a3c31' }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </Box>
                      {card.priority && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            icon={<Label />}
                            label={getPriorityLabel(card.priority)}
                            size="small"
                            color={getPriorityColor(card.priority)}
                            variant="filled"
                            sx={{ fontWeight: 'bold', backgroundColor: getPriorityColor(card.priority) }}
                          />
                        </Box>
                      )}
                      {card.labels && card.labels.length > 0 && (
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {card.labels.map((label, index) => (
                            <Chip 
                              key={index}
                              label={label}
                              size="small"
                              sx={{ 
                                backgroundColor: '#d8e2dc', // Muted tea green
                                color: '#4a3c31',
                                height: 20,
                                fontSize: '0.6rem',
                                fontWeight: 'bold',
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </DraggableCard>
                ))}
                
                <Button
                  fullWidth
                  startIcon={<Add />}
                  sx={{ 
                    mt: 1,
                    justifyContent: 'flex-start',
                    color: '#4a3c31',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    py: 1,
                    '&:hover': { 
                      backgroundColor: 'rgba(216,226,220,0.3)', // Light tea green hover
                      transform: 'translateY(-1px)',
                    } 
                  }}
                  onClick={() => {
                    setSelectedList(list);
                    setOpenedCardModal(true);
                  }}
                >
                  Add a card
                </Button>
              </Box>
            </DraggableList>
          ))}
          
          <Paper
            sx={{ 
              minWidth: 300, 
              minHeight: 100, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'linear-gradient(45deg, #f7b7a3, #ffccbc)', // Soft coral to peach
              color: '#4a3c31',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease',
              '&:hover': { 
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              },
            }}
            onClick={() => setOpenedListModal(true)}
          >
            <Add sx={{ mr: 1, fontSize: '1.5rem', color: '#4a3c31' }} />
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#4a3c31' }}>
              Add another list
            </Typography>
          </Paper>
        </Box>

      {/* Create List Modal */}
      <Modal
        open={openedListModal}
        onClose={() => setOpenedListModal(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper sx={{ 
          p: 3, 
          width: 400, 
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #ffffff, #f5f7fa)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            Create New List
          </Typography>
          <TextField
            fullWidth
            label="List Title"
            placeholder="Enter list title"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') createList();
            }}
            sx={{ mb: 2 }}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={createList} 
              sx={{ 
                flexGrow: 1,
                background: `linear-gradient(45deg, ${COLORS.primary}, ${COLORS.secondary})`,
                fontWeight: 'bold'
              }}
            >
              Create List
            </Button>
            <Button 
              onClick={() => setOpenedListModal(false)}
              sx={{ color: COLORS.text }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Edit List Modal */}
      <Modal
        open={editListModalOpen}
        onClose={() => setEditListModalOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper sx={{ 
          p: 3, 
          width: 400, 
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #ffffff, #f5f7fa)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            Edit List
          </Typography>
          <TextField
            fullWidth
            label="List Title"
            placeholder="Enter list title"
            value={editListTitle}
            onChange={(e) => setEditListTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleEditList();
            }}
            sx={{ mb: 2 }}
            autoFocus
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={handleEditList} 
              sx={{ 
                flexGrow: 1,
                background: `linear-gradient(45deg, ${COLORS.primary}, ${COLORS.secondary})`,
                fontWeight: 'bold'
              }}
            >
              Save
            </Button>
            <Button 
              onClick={() => setEditListModalOpen(false)}
              sx={{ color: COLORS.text }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Create Card Modal */}
      <Modal
        open={openedCardModal}
        onClose={() => setOpenedCardModal(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper sx={{ 
          p: 3, 
          width: 400, 
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #ffffff, #f5f7fa)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            Add New Card to {selectedList?.title}
          </Typography>
          <TextField
            fullWidth
            label="Card Title"
            placeholder="Enter card title"
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            sx={{ mb: 2 }}
            autoFocus
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={newCardPriority}
              label="Priority"
              onChange={(e) => setNewCardPriority(e.target.value)}
            >
              <SelectMenuItem value="low">Low</SelectMenuItem>
              <SelectMenuItem value="medium">Medium</SelectMenuItem>
              <SelectMenuItem value="high">High</SelectMenuItem>
              <SelectMenuItem value="critical">Critical</SelectMenuItem>
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={createCard} 
              sx={{ 
                flexGrow: 1,
                background: `linear-gradient(45deg, ${COLORS.primary}, ${COLORS.secondary})`,
                fontWeight: 'bold'
              }}
            >
              Add Card
            </Button>
            <Button 
              onClick={() => setOpenedCardModal(false)}
              sx={{ color: COLORS.text }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Modal>

      {/* Edit Card Modal */}
      <Modal
        open={editCardModalOpen}
        onClose={() => setEditCardModalOpen(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Paper sx={{ 
          p: 3, 
          width: 400, 
          borderRadius: 2,
          background: 'linear-gradient(to bottom, #ffffff, #f5f7fa)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            Edit Card
          </Typography>
          <TextField
            fullWidth
            label="Card Title"
            placeholder="Enter card title"
            value={editCardTitle}
            onChange={(e) => setEditCardTitle(e.target.value)}
            sx={{ mb: 2 }}
            autoFocus
          />
          <TextField
            fullWidth
            label="Description"
            placeholder="Enter card description"
            value={editCardDescription}
            onChange={(e) => setEditCardDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={editCardPriority}
              label="Priority"
              onChange={(e) => setEditCardPriority(e.target.value)}
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Due Date"
            type="date"
            value={editCardDueDate}
            onChange={(e) => setEditCardDueDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Labels"
            placeholder="Enter labels (comma-separated)"
            value={editCardLabels}
            onChange={(e) => setEditCardLabels(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={updateCard} 
              sx={{ 
                flexGrow: 1,
                background: `linear-gradient(45deg, ${COLORS.primary}, ${COLORS.secondary})`,
                fontWeight: 'bold'
              }}
            >
              Save Changes
            </Button>
            <Button 
              onClick={() => setEditCardModalOpen(false)}
              sx={{ color: COLORS.text }}
            >
              Cancel
            </Button>
          </Box>
        </Paper>
      </Modal>


      {/* List Options Menu */}
      <Menu
        anchorEl={listMenuAnchor}
        open={Boolean(listMenuAnchor)}
        onClose={handleListMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          }
        }}
      >
        <MenuItem onClick={handleEditClick} sx={{ color: COLORS.primary }}>
          <Edit sx={{ mr: 1, color: COLORS.primary }} fontSize="small" /> Edit List
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: COLORS.error }}>
          <Delete sx={{ mr: 1, color: COLORS.error }} fontSize="small" /> Delete List
        </MenuItem>
      </Menu>

      {/* Card Options Menu */}
      <Menu
        anchorEl={cardMenuAnchor}
        open={Boolean(cardMenuAnchor)}
        onClose={handleCardMenuClose}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            overflow: 'visible',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        {/* <MenuItem
          onClick={() => {
            handleOpenEditCardModal(selectedCard);
            handleCardMenuClose();
          }}
          sx={{ color: COLORS.primary }}
        >
          <Edit sx={{ mr: 1, color: COLORS.primary }} fontSize="small" /> Edit Card
        </MenuItem> */}

        <MenuItem
          onClick={() => {
            handleDeleteCardClick(selectedCard);
            handleCardMenuClose();
          }}
          sx={{ color: COLORS.error }}
        >
          <Delete sx={{ mr: 1, color: COLORS.error }} fontSize="small" /> Delete Card
        </MenuItem>
      </Menu>


      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(45deg, ${COLORS.error}, ${COLORS.warning})`,
          color: 'white',
          fontWeight: 'bold'
        }}>
          Delete List
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Typography>
            Are you sure you want to delete this list? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: COLORS.text }}>
            Cancel
          </Button>
          <Button 
            onClick={deleteList} 
            sx={{ 
              backgroundColor: COLORS.error,
              color: 'white',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setError('')} 
          severity="error" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSuccess('')} 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          {success}
        </Alert>
      </Snackbar>

    </Container>
  );
}