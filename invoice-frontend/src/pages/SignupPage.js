import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Alert, Grid } from '@mui/material';
import { signup } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { styled } from '@mui/system';

const AnimatedContainer = styled(motion.div)({
  maxWidth: '800px',
  margin: '0 auto',
  padding: '2rem',
  borderRadius: '16px',
  boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
  backgroundColor: 'white',
});

const GradientButton = styled(Button)({
  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
  border: 0,
  borderRadius: '8px',
  color: 'white',
  height: 48,
  padding: '0 30px',
  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .2)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px 2px rgba(33, 203, 243, .3)',
  },
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: '#ddd',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: '#2196F3',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#21CBF3',
      boxShadow: '0 0 0 2px rgba(33, 150, 243, 0.2)',
    },
  },
});

const SignupPage = () => {
  const [form, setForm] = useState({
    shopkeeper_name: '',
    shop_name: '',
    gst_number: '',
    account_number: '',
    bank_name: '',
    account_holder_name: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await signup(form);
      setSuccess('Signup successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.gst_number || err.response?.data?.detail || 'Signup failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <Box 
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%)',
        padding: '1rem'
      }}
    >
      <AnimatedContainer
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            textAlign: 'center',
            fontWeight: 'bold',
            mb: 4,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '2rem', sm: '2.5rem' }
          }}
        >
          Create Your Account
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="Shopkeeper Name" 
                  name="shopkeeper_name" 
                  value={form.shopkeeper_name} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="Shop Name" 
                  name="shop_name" 
                  value={form.shop_name} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
            
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="GST Number" 
                  name="gst_number" 
                  value={form.gst_number} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="Account Number" 
                  name="account_number" 
                  value={form.account_number} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="Bank Name" 
                  name="bank_name" 
                  value={form.bank_name} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
            
            <Grid item xs={12}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="Account Holder Name" 
                  name="account_holder_name" 
                  value={form.account_holder_name} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="Password" 
                  name="password" 
                  type="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <motion.div variants={itemVariants}>
                <StyledTextField 
                  label="Confirm Password" 
                  name="confirm_password" 
                  type="password" 
                  value={form.confirm_password} 
                  onChange={handleChange} 
                  fullWidth 
                  margin="normal" 
                  required
                />
              </motion.div>
            </Grid>
          </Grid>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="error" sx={{ mt: 2, borderRadius: '8px' }}>{error}</Alert>
            </motion.div>
          )}
          
          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>{success}</Alert>
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </GradientButton>
          </Box>
        </form>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Typography 
            variant="body2" 
            sx={{ 
              textAlign: 'center', 
              mt: 3, 
              color: '#666',
              '&:hover': {
                color: '#2196F3',
                cursor: 'pointer'
              }
            }}
            onClick={() => navigate('/login')}
          >
            Already have an account? Login here
          </Typography>
        </motion.div>
      </AnimatedContainer>
    </Box>
  );
};

export default SignupPage;