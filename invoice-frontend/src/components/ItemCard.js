import React from 'react';
import { Card, CardContent, Typography, Chip, IconButton, Box } from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';

const ItemCard = ({ item, onEdit, onDelete }) => {
  return (
    <Card sx={{ minWidth: 220, maxWidth: 300, m: 1, boxShadow: 3, borderRadius: 3 }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
          {item.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Chip label={`₹${parseFloat(item.price).toFixed(2)}`} color="secondary" sx={{ fontWeight: 700, mr: 1 }} />
          <Chip
            label={`Stock: ${item.stock}`}
            sx={{
              background: item.stock > 10
                ? 'success.main'
                : item.stock > 5
                ? 'secondary.main'
                : 'error.main',
              color: '#fff',
              fontWeight: 700,
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <IconButton size="small" color="primary" onClick={() => onEdit(item)}>
            <Edit />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => onDelete(item.id)}>
            <Delete />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ItemCard; 