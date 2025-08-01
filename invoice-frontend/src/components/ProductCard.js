import React from 'react';
import { Card, CardContent, Typography, Chip, Button, Box } from '@mui/material';

const ProductCard = ({ product, onAdd, sx }) => (
  <Card sx={{ 
    ...sx,
    width: 240, 
    height: 200, // Set a fixed height
    m: 1, 
    boxShadow: 3, 
    borderRadius: 4, 
    display: 'flex', 
    flexDirection: 'column',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: 6,
    }
  }}>
    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700, 
          mb: 1,
          // Truncate long text
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          minHeight: '3rem', // Reserve space for two lines
        }}
      >
        {product.name}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Chip label={`₹${parseFloat(product.price).toFixed(2)}`} color="secondary" sx={{ fontWeight: 700, mr: 1 }} />
        <Chip
          label={`Stock: ${product.stock}`}
          sx={{
            background: product.stock > 10
              ? 'success.main'
              : product.stock > 5
              ? 'secondary.main'
              : 'error.main',
            color: '#fff',
            fontWeight: 700,
          }}
        />
      </Box>
      <Box sx={{ marginTop: 'auto' }}> {/* Push button to the bottom */}
        <Button
          variant="contained"
          color="primary"
          fullWidth
          disabled={product.stock === 0}
          onClick={() => onAdd(product)}
          sx={{ mt: 2, borderRadius: 2, fontWeight: 700 }}
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add'}
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export default ProductCard; 