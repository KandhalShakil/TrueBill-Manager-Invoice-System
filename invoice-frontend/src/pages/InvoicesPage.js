import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
  Fade,
  Slide,
  CircularProgress,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Receipt,
  Visibility,
  Download,
  Search,
  FilterList,
  Add,
} from '@mui/icons-material';
import axios from 'axios';
import { getInvoices, getInvoicePdf } from '../services/api';
import { useNavigate } from 'react-router-dom';


const API_BASE_URL = 'http://localhost:8000/api';

const InvoicesPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await getInvoices();
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPdf = async (invoiceId) => {
    try {
      const response = await getInvoicePdf(invoiceId);
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(pdfUrl, '_blank');
      if (!newWindow) {
        alert('Please allow pop-ups to view the PDF');
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      console.error('Error fetching PDF:', error);
      alert('Error fetching PDF. Please try again.');
    }
  };

  const handleDownloadPdf = async (invoiceId, billNumber) => {
    try {
      const response = await getInvoicePdf(invoiceId);
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `invoice_${billNumber || invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error downloading PDF. Please try again.');
    }
  };

  const handleStatusChange = async (invoiceId, newStatus) => {
    setStatusUpdating((prev) => ({ ...prev, [invoiceId]: true }));
    try {
      await axios.patch(`${API_BASE_URL}/invoices/${invoiceId}/`, { status: newStatus });
      fetchInvoices(); // Refresh the list so all affected invoices update their status
    } catch (e) {
      alert('Failed to update status');
    } finally {
      setStatusUpdating((prev) => ({ ...prev, [invoiceId]: false }));
    }
  };

  const handleStatusFilterClick = (status) => {
    setStatusFilter(status);
    setSearchTerm(''); // Clear search when filter is applied
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      invoice.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.bill_number?.toString().includes(searchTerm) ||
      invoice.id?.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || invoice.status?.toLowerCase() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
        py: 3,
        px: 2,
        color: '#ffffff',
      }}
    >
      <Container maxWidth="xl" sx={{ mt: 10 }}>
        <Fade in timeout={800}>
          <Box sx={{ mb: 6, textAlign: 'center' }}>
            <Typography 
              variant="h3" 
              gutterBottom 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(45deg, #90CAF9, #CE93D8)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 4px 20px rgba(144, 202, 249, 0.3)',
                mb: 2,
                letterSpacing: '1px',
              }}
            >
              <Receipt sx={{ verticalAlign: 'middle', mr: 2, fontSize: 'inherit' }} />
              Invoice Management
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                fontWeight: 300,
                letterSpacing: '0.5px',
                maxWidth: '800px',
                mx: 'auto',
                lineHeight: '1.6',
              }}
            >
              Efficiently manage, track, and analyze all your invoices in one centralized dashboard
            </Typography>
          </Box>
        </Fade>

        {/* Action Bar */}
        <Slide direction="down" in timeout={1000}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0,
          }}>
            {statusFilter !== 'all' && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1,
                mb: isMobile ? 2 : 0,
                width: isMobile ? '100%' : 'auto'
              }}>
                <Chip
                  label={`Showing: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Invoices`}
                  sx={{
                    background: statusFilter === 'paid' 
                      ? 'linear-gradient(135deg, #81C784 0%, #4CAF50 100%)'
                      : statusFilter === 'pending'
                      ? 'linear-gradient(135deg, #FFB74D 0%, #FF9800 100%)'
                      : 'linear-gradient(135deg, #E57373 0%, #F44336 100%)',
                    color: '#FFFFFF',
                    fontWeight: 600,
                  }}
                />
                <Button
                  size="small"
                  onClick={() => handleStatusFilterClick('all')}
                  sx={{
                    color: '#90CAF9',
                    fontSize: '0.75rem',
                    '&:hover': {
                      color: '#FFFFFF',
                    },
                  }}
                >
                  Clear Filter
                </Button>
              </Box>
            )}
            <TextField
              placeholder="Search invoices..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                minWidth: isMobile ? '100%' : '350px',
                background: '#1E1E1E',
                borderRadius: '4px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: '#333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#90CAF9',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#90CAF9',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#90CAF9' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<FilterList />}
                sx={{
                  color: '#90CAF9',
                  borderColor: '#90CAF9',
                  '&:hover': {
                    borderColor: '#90CAF9',
                    backgroundColor: 'rgba(144, 202, 249, 0.08)',
                  },
                }}
              >
                Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/create-invoice')}
                sx={{
                  background: 'linear-gradient(135deg, #90CAF9 0%, #CE93D8 100%)',
                  color: '#121212',
                  fontWeight: 600,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #7FB6F5 0%, #BA82D3 100%)',
                  },
                }}
              >
                New Invoice
              </Button>
            </Box>
          </Box>
        </Slide>

        {/* Stats Cards */}
        <Slide direction="down" in timeout={1000}>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                onClick={() => handleStatusFilterClick('all')}
                sx={{ 
                  background: statusFilter === 'all' 
                    ? 'linear-gradient(135deg, #90CAF9 0%, #CE93D8 100%)' 
                    : 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
                  border: '1px solid #333',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(144, 202, 249, 0.2)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: statusFilter === 'all' ? '#FFFFFF' : '#90CAF9', 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    {invoices.length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: statusFilter === 'all' ? '#FFFFFF' : 'rgba(255,255,255,0.7)' 
                  }}>
                    Total Invoices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                onClick={() => handleStatusFilterClick('paid')}
                sx={{ 
                  background: statusFilter === 'paid' 
                    ? 'linear-gradient(135deg, #81C784 0%, #4CAF50 100%)' 
                    : 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
                  border: '1px solid #333',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(129, 199, 132, 0.2)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: statusFilter === 'paid' ? '#FFFFFF' : '#81C784', 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    {invoices.filter(inv => inv.status?.toLowerCase() === 'paid').length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: statusFilter === 'paid' ? '#FFFFFF' : 'rgba(255,255,255,0.7)' 
                  }}>
                    Paid Invoices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                onClick={() => handleStatusFilterClick('pending')}
                sx={{ 
                  background: statusFilter === 'pending' 
                    ? 'linear-gradient(135deg, #FFB74D 0%, #FF9800 100%)' 
                    : 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
                  border: '1px solid #333',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(255, 183, 77, 0.2)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: statusFilter === 'pending' ? '#FFFFFF' : '#FFB74D', 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    {invoices.filter(inv => inv.status?.toLowerCase() === 'pending').length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: statusFilter === 'pending' ? '#FFFFFF' : 'rgba(255,255,255,0.7)' 
                  }}>
                    Pending Invoices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                onClick={() => handleStatusFilterClick('cancelled')}
                sx={{ 
                  background: statusFilter === 'cancelled' 
                    ? 'linear-gradient(135deg, #E57373 0%, #F44336 100%)' 
                    : 'linear-gradient(135deg, #121212 0%, #1E1E1E 100%)',
                  border: '1px solid #333',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(229, 115, 115, 0.2)',
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: statusFilter === 'cancelled' ? '#FFFFFF' : '#E57373', 
                    fontWeight: 700,
                    mb: 1,
                  }}>
                    {invoices.filter(inv => inv.status?.toLowerCase() === 'cancelled').length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: statusFilter === 'cancelled' ? '#FFFFFF' : 'rgba(255,255,255,0.7)' 
                  }}>
                    Cancelled Invoices
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Slide>

        {/* Invoices Table */}
        <Slide direction="up" in timeout={1200}>
          <Card sx={{ 
            p: 0,
            background: '#1E1E1E',
            border: '1px solid #333',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  minHeight: '300px',
                }}>
                  <CircularProgress size={60} sx={{ color: '#90CAF9' }} />
                </Box>
              ) : filteredInvoices.length === 0 ? (
                <Box sx={{ 
                  textAlign: 'center', 
                  py: 8,
                  background: 'rgba(30, 30, 30, 0.7)',
                }}>
                  <Receipt sx={{ 
                    fontSize: 64, 
                    color: '#90CAF9', 
                    mb: 2,
                    opacity: 0.5,
                  }} />
                  <Typography variant="h6" sx={{ 
                    color: 'rgba(255,255,255,0.7)', 
                    fontWeight: 500,
                    mb: 1,
                  }}>
                    No Invoices Found
                  </Typography>
                  <Typography sx={{ 
                    color: 'rgba(255,255,255,0.5)',
                    maxWidth: '500px',
                    mx: 'auto',
                  }}>
                    {searchTerm ? 'Try adjusting your search query' : 'Create your first invoice to get started'}
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ 
                  background: 'transparent',
                  maxHeight: 'calc(100vh - 400px)',
                }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow sx={{
                        '& th': {
                          backgroundColor: '#121212',
                          color: '#90CAF9',
                          borderBottom: '1px solid #333',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        },
                      }}>
                        <TableCell>Invoice #</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Items</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredInvoices.map((invoice, idx) => (
                        <TableRow 
                          key={invoice.id} 
                          sx={{
                            background: idx % 2 === 0 ? 'rgba(30, 30, 30, 0.5)' : 'rgba(40, 40, 40, 0.5)',
                            transition: 'background 0.3s',
                            '&:hover': {
                              background: 'rgba(144, 202, 249, 0.1)',
                            },
                            '& td': {
                              borderBottom: '1px solid #333',
                              color: 'rgba(255,255,255,0.87)',
                            },
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500 }}>#{invoice.bill_number || invoice.id}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>{invoice.customer_name}</TableCell>
                          <TableCell>
                            {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }) : '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={invoice.items?.length || 0}
                              sx={{
                                background: 'rgba(144, 202, 249, 0.1)',
                                color: '#90CAF9',
                                fontWeight: 600,
                                border: '1px solid rgba(144, 202, 249, 0.3)',
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography sx={{ 
                              fontWeight: 700, 
                              color: '#81C784',
                            }}>
                              ₹{parseFloat(invoice.total || 0).toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {invoice.status === 'pending' && !statusUpdating[invoice.id] ? (
                              <Select
                                value={invoice.status || 'pending'}
                                onChange={(e) => handleStatusChange(invoice.id, e.target.value)}
                                size="small"
                                sx={{
                                  fontWeight: 700,
                                  color: '#fff',
                                  background:
                                    invoice.status === 'paid'
                                      ? 'rgba(129, 199, 132, 0.2)'
                                      : invoice.status === 'cancelled'
                                      ? 'rgba(229, 115, 115, 0.2)'
                                      : 'rgba(255, 183, 77, 0.2)',
                                  border:
                                    invoice.status === 'paid'
                                      ? '1px solid rgba(129, 199, 132, 0.5)'
                                      : invoice.status === 'cancelled'
                                      ? '1px solid rgba(229, 115, 115, 0.5)'
                                      : '1px solid rgba(255, 183, 77, 0.5)',
                                  borderRadius: 2,
                                  minWidth: 110,
                                  '& .MuiSelect-icon': { color: '#fff' },
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                }}
                                MenuProps={{
                                  PaperProps: {
                                    sx: {
                                      bgcolor: '#1E1E1E',
                                      color: '#fff',
                                      border: '1px solid #333',
                                    },
                                  },
                                }}
                                disabled={statusUpdating[invoice.id]}
                              >
                                <MenuItem value="pending" sx={{ color: '#FFB74D' }}>Pending</MenuItem>
                                <MenuItem value="paid" sx={{ color: '#81C784' }}>Paid</MenuItem>
                                <MenuItem value="cancelled" sx={{ color: '#E57373' }}>Cancelled</MenuItem>
                              </Select>
                            ) : statusUpdating[invoice.id] ? (
                              <CircularProgress size={22} />
                            ) : (
                              <Chip
                                label={invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Pending'}
                                sx={{
                                  background:
                                    invoice.status === 'paid'
                                      ? 'rgba(129, 199, 132, 0.2)'
                                      : invoice.status === 'cancelled'
                                      ? 'rgba(229, 115, 115, 0.2)'
                                      : 'rgba(255, 183, 77, 0.2)',
                                  color:
                                    invoice.status === 'paid'
                                      ? '#81C784'
                                      : invoice.status === 'cancelled'
                                      ? '#E57373'
                                      : '#FFB74D',
                                  fontWeight: 700,
                                  border:
                                    invoice.status === 'paid'
                                      ? '1px solid rgba(129, 199, 132, 0.5)'
                                      : invoice.status === 'cancelled'
                                      ? '1px solid rgba(229, 115, 115, 0.5)'
                                      : '1px solid rgba(255, 183, 77, 0.5)',
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                              <IconButton
                                onClick={() => handleViewPdf(invoice.id)}
                                sx={{
                                  background: 'rgba(144, 202, 249, 0.1)',
                                  color: '#90CAF9',
                                  border: '1px solid rgba(144, 202, 249, 0.3)',
                                  '&:hover': {
                                    background: 'rgba(144, 202, 249, 0.2)',
                                  },
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDownloadPdf(invoice.id, invoice.bill_number)}
                                sx={{
                                  background: 'rgba(206, 147, 216, 0.1)',
                                  color: '#CE93D8',
                                  border: '1px solid rgba(206, 147, 216, 0.3)',
                                  '&:hover': {
                                    background: 'rgba(206, 147, 216, 0.2)',
                                  },
                                }}
                              >
                                <Download fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Slide>
      </Container>
    </Box>
  );
};

export default InvoicesPage;