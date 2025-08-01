import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  useTheme, 
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Receipt, 
  Add, 
  Inventory, 
  Assessment, 
  Menu,
  Close
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/invoices', label: 'Invoices', icon: <Receipt /> },
    { path: '/create-invoice', label: 'Create Invoice', icon: <Add /> },
    { path: '/items', label: 'Items', icon: <Inventory /> },
    { path: '/reports', label: 'Reports', icon: <Assessment /> },
    { path: '/customers', label: 'Customers', icon: <Inventory /> }, // Add Customers link
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box
      sx={{
        width: 250,
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
        color: 'white',
        padding: 2
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Menu
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: '#333333', mb: 2 }} />
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.path}
            component={Link}
            to={item.path}
            onClick={handleDrawerToggle}
            sx={{
              borderRadius: 0,
              mb: 0.5,
              backgroundColor: location.pathname === item.path ? 'rgba(100, 181, 246, 0.2)' : 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(100, 181, 246, 0.15)',
              }
            }}
          >
            <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.primary.main : 'text.secondary' }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.label} 
              sx={{ 
                color: location.pathname === item.path ? theme.palette.primary.main : 'text.secondary',
                '& .MuiTypography-root': {
                  fontWeight: location.pathname === item.path ? 600 : 400
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed"
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          borderBottom: '1px solid #333333',
          backdropFilter: 'blur(10px)',
          zIndex: theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between',
          px: { xs: 1, sm: 3 },
          py: 1
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1 }}
              >
                <Menu />
              </IconButton>
            )}
            <Typography 
              variant="h6" 
              component={Link} 
              to="/"
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                fontWeight: 700,
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                letterSpacing: '1px',
                textTransform: 'uppercase',
                '&:hover': {
                  color: 'primary.light',
                }
              }}
            >
              GROCERY INVOICE GENERATOR SYSTEM
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              alignItems: 'center'
            }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                    backgroundColor: location.pathname === item.path ? 'rgba(100, 181, 246, 0.1)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    minWidth: 'auto',
                    fontSize: '0.875rem',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    textTransform: 'capitalize',
                    '&:hover': {
                      backgroundColor: 'rgba(100, 181, 246, 0.15)',
                      color: 'primary.main',
                    },
                    '& .MuiButton-startIcon': {
                      marginRight: 1,
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {!isAuthenticated && (
                <>
                  <Button color="inherit" component={Link} to="/login">Login</Button>
                  <Button color="inherit" component={Link} to="/signup">Signup</Button>
                </>
              )}
              {isAuthenticated && (
                <Button color="inherit" onClick={handleLogout}>Logout</Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 250,
          },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default NavBar;