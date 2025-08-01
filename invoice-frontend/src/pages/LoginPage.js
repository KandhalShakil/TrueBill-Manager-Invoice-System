import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert } from '@mui/material';
import { login } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { styled } from '@mui/system';

const AnimatedBox = styled(motion.div)({
  maxWidth: 400,
  margin: '0 auto',
  padding: '2rem',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
  backgroundColor: 'white',
});

const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  border: 0,
  borderRadius: '8px',
  color: 'white',
  height: 48,
  padding: '0 30px',
  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px 2px rgba(255, 105, 135, .3)',
  },
});

const LoginPage = () => {
  const [form, setForm] = useState({ shop_name: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useAuth() || {};

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await login(form);
      const user = response.data && response.data.user ? response.data.user : { shop_name: form.shop_name };
      if (setIsAuthenticated) setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userData', JSON.stringify(user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '1rem'
      }}
    >
      <AnimatedBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            textAlign: 'center',
            fontWeight: 'bold',
            color: '#333',
            mb: 4,
            background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Welcome Back
        </Typography>
        
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <TextField 
            label="Shop Name" 
            name="shop_name" 
            value={form.shop_name} 
            onChange={handleChange} 
            fullWidth 
            margin="normal" 
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#ddd',
                  borderRadius: '8px'
                },
                '&:hover fieldset': {
                  borderColor: '#FE6B8B',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FF8E53',
                },
              }
            }}
          />
          
          <TextField 
            label="Password" 
            name="password" 
            type="password" 
            value={form.password} 
            onChange={handleChange} 
            fullWidth 
            margin="normal" 
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#ddd',
                  borderRadius: '8px'
                },
                '&:hover fieldset': {
                  borderColor: '#FE6B8B',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#FF8E53',
                },
              }
            }}
          />
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>{error}</Alert>
            </motion.div>
          )}
          
          <Box sx={{ mt: 3 }}>
            <GradientButton 
              type="submit" 
              fullWidth 
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </GradientButton>
          </Box>
        </motion.form>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center', 
              mt: 3, 
              color: '#666',
              '&:hover': {
                color: '#FE6B8B',
                cursor: 'pointer'
              }
            }}
            onClick={() => navigate('/register')}
          >
            Don't have an account? Sign up
          </Typography>
        </motion.div>
      </AnimatedBox>
    </Box>
  );
};

export default LoginPage;