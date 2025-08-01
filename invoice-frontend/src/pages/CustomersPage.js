import React, { useEffect, useState } from 'react';
import {
  Box, Container, Typography, Card, CardContent, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/api';

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await getCustomers();
      setCustomers(res.data);
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to fetch customers', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer = null) => {
    setEditingCustomer(customer);
    setFormData(customer ? { name: customer.name, phone: customer.phone, address: customer.address } : { name: '', phone: '', address: '' });
    setOpenDialog(true);
  };
  const handleCloseDialog = () => { setOpenDialog(false); setEditingCustomer(null); };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setSnackbar({ open: true, message: 'Name is required', severity: 'error' });
      return;
    }
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, formData);
        setSnackbar({ open: true, message: 'Customer updated', severity: 'success' });
      } else {
        await createCustomer(formData);
        setSnackbar({ open: true, message: 'Customer added', severity: 'success' });
      }
      fetchCustomers();
      handleCloseDialog();
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to save customer', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      setSnackbar({ open: true, message: 'Customer deleted', severity: 'success' });
      fetchCustomers();
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to delete customer', severity: 'error' });
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <Container maxWidth="md" sx={{ mt: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              background: 'linear-gradient(45deg, #90CAF9, #CE93D8)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 20px rgba(144, 202, 249, 0.3)',
              mb: 2,
              letterSpacing: '1px',
            }}
          >
            Customers
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(135deg, #BB86FC 0%, #3700B3 100%)',
              color: '#fff',
              fontWeight: 600,
              borderRadius: '8px',
              boxShadow: '0 4px 8px rgba(187, 134, 252, 0.2)',
              px: 3,
              py: 1,
              '&:hover': {
                background: 'linear-gradient(135deg, #A25BFE 0%, #2A00A0 100%)',
                boxShadow: '0 6px 12px rgba(187, 134, 252, 0.3)',
              },
            }}
          >
            Add Customer
          </Button>
        </Box>
        <TextField
          label="Search by name or phone"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          fullWidth
          sx={{
            mb: 2,
            '& .MuiOutlinedInput-root': {
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 3,
              '& fieldset': {
                borderColor: 'rgba(255,255,255,0.2)',
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255,255,255,0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#90CAF9',
              },
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-focused': {
                color: '#90CAF9',
              },
            },
          }}
        />
        <Card
          sx={{
            background: 'linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(45,45,45,0.8) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            mb: 4,
          }}
        >
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600, fontSize: '1rem', background: '#121212', borderBottom: '1px solid #333' }}>Name</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600, fontSize: '1rem', background: '#121212', borderBottom: '1px solid #333' }}>Phone</TableCell>
                    <TableCell sx={{ color: '#90CAF9', fontWeight: 600, fontSize: '1rem', background: '#121212', borderBottom: '1px solid #333' }}>Address</TableCell>
                    <TableCell align="right" sx={{ color: '#90CAF9', fontWeight: 600, fontSize: '1rem', background: '#121212', borderBottom: '1px solid #333' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      sx={{
                        background: 'rgba(30, 30, 30, 0.5)',
                        '&:hover': {
                          background: 'rgba(144, 202, 249, 0.1)',
                        },
                        '& td': {
                          borderBottom: '1px solid #333',
                          color: 'rgba(255,255,255,0.87)',
                        },
                      }}
                    >
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.phone}</TableCell>
                      <TableCell>{customer.address}</TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => handleOpenDialog(customer)} sx={{ color: '#90CAF9' }}><Edit /></IconButton>
                        <IconButton onClick={() => handleDelete(customer.id)} sx={{ color: '#FF6B6B' }}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustomers.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ color: 'rgba(255,255,255,0.7)' }}>No customers found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#1E1E1E',
              color: '#FFFFFF',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            },
          }}
        >
          <DialogTitle
            sx={{
              color: '#BB86FC',
              fontWeight: 700,
              fontSize: '1.5rem',
              borderBottom: '1px solid #333',
            }}
          >
            {editingCustomer ? 'Edit Customer' : 'Add Customer'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              margin="normal"
              required
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: '#444',
                  },
                  '&:hover fieldset': {
                    borderColor: '#BB86FC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#BB86FC',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                },
                '& .MuiInputLabel-root': {
                  color: '#B0BEC5',
                },
              }}
            />
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
              margin="normal"
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: '#444',
                  },
                  '&:hover fieldset': {
                    borderColor: '#BB86FC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#BB86FC',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                },
                '& .MuiInputLabel-root': {
                  color: '#B0BEC5',
                },
              }}
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              margin="normal"
              multiline
              minRows={2}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  '& fieldset': {
                    borderColor: '#444',
                  },
                  '&:hover fieldset': {
                    borderColor: '#BB86FC',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#BB86FC',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#FFFFFF',
                },
                '& .MuiInputLabel-root': {
                  color: '#B0BEC5',
                },
              }}
            />
          </DialogContent>
          <DialogActions
            sx={{
              borderTop: '1px solid #333',
              px: 3,
              py: 2,
            }}
          >
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: '#B0BEC5',
                fontWeight: 600,
                '&:hover': {
                  color: '#FFFFFF',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #BB86FC 0%, #3700B3 100%)',
                color: '#FFFFFF',
                fontWeight: 600,
                borderRadius: '8px',
                boxShadow: '0 4px 8px rgba(187, 134, 252, 0.2)',
                px: 3,
                py: 1,
                '&:hover': {
                  background: 'linear-gradient(135deg, #A25BFE 0%, #2A00A0 100%)',
                  boxShadow: '0 6px 12px rgba(187, 134, 252, 0.3)',
                },
              }}
            >
              {editingCustomer ? 'Update' : 'Add'}
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default CustomersPage; 