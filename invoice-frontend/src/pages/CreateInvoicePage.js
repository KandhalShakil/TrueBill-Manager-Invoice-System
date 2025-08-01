import React, { useState, useEffect, useCallback } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Divider,
  Box,
  IconButton,
  Card,
  CardContent,
  useTheme,
  Alert,
  CircularProgress,
  Snackbar,
  Fade,
  Slide,
  InputAdornment,
  Pagination,
  Select,
  MenuItem,
  Stack
} from "@mui/material";
import {
  Search,
  Add,
  Remove,
  Delete,
  ShoppingCart,
  Person,
  Receipt,
  TrendingUp,
  Inventory,
  FlashOn,
  FilterList,
  PersonAdd
} from "@mui/icons-material";
import {
  searchItems,
  createInvoice,
  getItems,
  getCustomers
} from "../services/api";
import ProductCard from "../components/ProductCard";
import AddCustomerDialog from "../components/AddCustomerDialog";
import { useAuth } from '../context/AuthContext';


const CreateInvoicePage = () => {
  const theme = useTheme();
  const { userData } = useAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({ name: "", phone: "" });
  const [dailySales, setDailySales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [pendingAmount, setPendingAmount] = useState(null);
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [previousPendingItems, setPreviousPendingItems] = useState([]);
  const [customerList, setCustomerList] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);

  const productsPerPage = 10;
  const paginatedItems = items.slice(
    (productPage - 1) * productsPerPage,
    productPage * productsPerPage
  );
  const totalPages = Math.ceil(items.length / productsPerPage);

  useEffect(() => {
    fetchAllItems();
    fetchDailySales();
    fetchCustomers();
  }, []);

  const fetchAllItems = async () => {
    try {
      setLoading(true);
      const response = await getItems();
      setAllItems(response.data);
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      setError("Failed to load items. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySales = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `http://localhost:8000/api/daily-sales/?date=${today}`
      );
      if (response.ok) {
        const data = await response.json();
        setDailySales(data);
      }
    } catch (error) {
      console.error("Error fetching daily sales:", error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await getCustomers();
      setCustomerList(res.data);
    } catch (e) {
      // Optionally handle error
    }
  };

  const searchItemsCallback = useCallback(
    async (term) => {
      if (term.trim()) {
        try {
          const response = await searchItems(term);
          setItems(response.data);
        } catch (error) {
          console.error("Error searching items:", error);
          setError("Failed to search items.");
        }
      } else {
        setItems(allItems);
      }
    },
    [allItems]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchItemsCallback(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, searchItemsCallback]);

  const addToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    setSuccess(`✨ Added ${item.name} to cart`);
  };

  const updateQuantity = (id, change) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.map((item) => {
        if (item.id === id) {
          const newQuantity = item.quantity + change;
          return { ...item, quantity: newQuantity > 0 ? newQuantity : 1 };
        }
        return item;
      });
      return updatedCart;
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
    setSuccess("🗑️ Item removed from cart");
  };

  const calculateTotals = () => {
    const subtotal = cart.reduce(
      (sum, item) => sum + parseFloat(item.price) * item.quantity,
      0
    );
    const tax = subtotal * 0.05;
    const discount = subtotal * 0.02;
    const total = subtotal + tax - discount;

    return { subtotal, tax, discount, total };
  };

  const handleSubmit = async () => {
    if (!customer.name.trim()) {
      setError("⚠️ Please enter customer name");
      return;
    }

    if (cart.length === 0) {
      setError("🛒 Please add at least one item to cart");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createInvoice({
        customer_name: customer.name,
        customer_phone: customer.phone,
        items: cart.map(item => ({
          item_id: item.id,
          quantity: item.quantity
        }))
      });

      if (response.data.previous_pending_items) {
        setPreviousPendingItems(response.data.previous_pending_items);
      }
      if (response.data.pending_amount) {
        setPendingAmount(response.data.pending_amount);
      }
      if (response.data.thank_you_message) {
        setThankYouMessage(response.data.thank_you_message);
      }

      setSuccess("✨ Invoice created successfully!");
      setCart([]);
      setCustomer({ name: "", phone: "" });
      fetchDailySales();
    } catch (error) {
      setError(error.response?.data?.error || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }

    setSubmitting(true);
    setError("");
    setPendingAmount(null);
    setThankYouMessage("");

    const invoiceData = {
      customer_name: customer.name.trim(),
      customer_phone: customer.phone.trim(),
      items: cart.map((item) => ({
        item_id: item.id,
        quantity: item.quantity,
      })),
    };

    try {
      const response = await createInvoice(invoiceData);
      setSuccess(`🎉 Invoice created successfully! Bill #: ${response.data.bill_number}`);

      if (response.data.pending_amount) {
        setPendingAmount(response.data.pending_amount);
      }
      if (response.data.thank_you_message) {
        setThankYouMessage(response.data.thank_you_message);
      }

      try {
        // Pass pendingAmount and previous_pending_items as query params if present
        let pdfUrl = `http://localhost:8000/api/invoices/${response.data.id}/pdf/`;
        const params = [];
        if (response.data.thank_you_message) {
          params.push(`thank_you_message=${encodeURIComponent(response.data.thank_you_message)}`);
        }
        if (response.data.pending_amount) {
          params.push(`pending_amount=${encodeURIComponent(response.data.pending_amount)}`);
        }

        if (params.length > 0) {
          pdfUrl += `?${params.join('&')}`;
        }
        const pdfResponse = await fetch(pdfUrl);
        if (!pdfResponse.ok) throw new Error('Failed to fetch PDF');
        const pdfBlob = await pdfResponse.blob();
        const pdfBlobUrl = URL.createObjectURL(pdfBlob);
        const newWindow = window.open(pdfBlobUrl, "_blank");
        if (!newWindow) {
          setError("📄 Please allow pop-ups to view the PDF");
        }
        setTimeout(() => URL.revokeObjectURL(pdfBlobUrl), 1000);
      } catch (pdfError) {
        console.error("Error fetching PDF:", pdfError);
        setError("📄 Invoice created but PDF generation failed. Please try again.");
      }

      setCart([]);
      setCustomer({ name: "", phone: "" });
      fetchDailySales();
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error.response) {
        setError(`❌ Error creating invoice: ${JSON.stringify(error.response.data)}`);
      } else {
        setError("❌ Error creating invoice. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const { subtotal, tax, discount, total } = calculateTotals();

  const handleCloseSnackbar = () => {
    setError("");
    setSuccess("");
  };

  const dashboardStats = [
    {
      label: "Today's Sales",
      value: dailySales ? `₹${parseFloat(dailySales.total_sales || 0).toFixed(2)}` : "₹0.00",
      color: "#4a6bff",
      icon: <TrendingUp sx={{ color: "#fff", fontSize: 32 }} />,
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #121212 0%, #1E1E1E 100%)",
        py: 3,
        px: 2,
        color: "#ffffff",
        fontFamily: 'Georgia, Times New Roman, Times, serif',
      }}
    >
      <Container maxWidth="xl" sx={{ mt: 10 }}>
        {/* Shopkeeper Info Section */}
        <Box sx={{ mb: 3, p: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 2, border: '1px solid #FFD700', color: '#FFD700' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Shopkeeper Info</Typography>
          <Typography>GST Number: {userData?.gst_number || '-'}</Typography>
          <Typography>Account Number: {userData?.account_number || '-'}</Typography>
          <Typography>Bank Name: {userData?.bank_name || '-'}</Typography>
          <Typography>Account Holder Name: {userData?.account_holder_name || '-'}</Typography>
        </Box>

        <Box sx={{ px: { xs: 1, md: 4 } }}>
          {/* Header Section */}
          <Fade in timeout={800}>
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography
                variant="h3"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  background: "linear-gradient(45deg, #90CAF9, #CE93D8)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow: "0 4px 20px rgba(144, 202, 249, 0.3)",
                  mb: 2,
                  letterSpacing: "1px",
                  [theme.breakpoints.down("sm")]: {
                    fontSize: "2rem",
                  },
                }}
              >
                <Receipt sx={{ verticalAlign: "middle", mr: 2, fontSize: "inherit" }} />
                Create New Invoice
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: "rgba(255,255,255,0.7)",
                  fontWeight: 300,
                  letterSpacing: "0.5px",
                  maxWidth: "800px",
                  mx: "auto",
                  lineHeight: "1.6",
                  [theme.breakpoints.down("sm")]: {
                    fontSize: "1rem",
                  },
                }}
              >
                Transform your sales process with our powerful invoice generator
              </Typography>
            </Box>
          </Fade>

          {/* Top Section: Dashboard and Search Bar side by side on large screens */}
          <Grid container spacing={3} alignItems="stretch">
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Dashboard Card */}
              {dailySales && (
                <Card sx={{ flex: '0 0 auto', background: "linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(45,45,45,0.8) 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(45deg, #4CAF50, #8BC34A)",
                          borderRadius: "50%",
                          p: 1,
                          mr: 2,
                          boxShadow: "0 4px 12px rgba(76, 175, 80, 0.4)",
                        }}
                      >
                        <TrendingUp sx={{ color: "white", fontSize: 28 }} />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 700,
                          color: "white",
                          textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                          [theme.breakpoints.down("sm")]: {
                            fontSize: "1.5rem",
                          },
                        }}
                      >
                        Today's Sales Dashboard
                      </Typography>
                    </Box>
                    <Grid container spacing={3}>
                      {dashboardStats.map((stat, index) => (
                        <Grid item xs={12} sm={6} md={6} key={index}>
                          <Box
                            sx={{
                              textAlign: "center",
                              p: 2,
                              background: `linear-gradient(135deg, rgba(${hexToRgb(stat.color)}, 0.2), rgba(${hexToRgb(stat.color)}, 0.1))`,
                              borderRadius: 3,
                              border: `1px solid rgba(${hexToRgb(stat.color)}, 0.3)`,
                              transition: "transform 0.3s",
                              "&:hover": {
                                transform: "translateY(-5px)",
                              },
                            }}
                          >
                            {stat.icon}
                            <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color, mb: 1 }}>
                              {stat.value}
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
                              {stat.label}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}
              <Card sx={{ flex: '1 1 auto', background: "linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(45,45,45,0.8) 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
                        borderRadius: "50%",
                        p: 1,
                        mr: 2,
                        boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)",
                      }}
                    >
                      <Search sx={{ color: "white", fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.9)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      Search Products
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Type to search items by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255,255,255,0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "rgba(255,255,255,0.5)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#4ECDC4",
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(255,255,255,0.7)",
                      },
                      "& .MuiInputBase-input::placeholder": {
                        color: "rgba(255,255,255,0.5)",
                        opacity: 1,
                      },
                    }}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setSearchTerm("")}>
                            <FilterList sx={{ color: "rgba(255,255,255,0.5)" }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
            {/* Right side: Customer + Cart */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: "linear-gradient(135deg, #232526 0%, #414345 100%)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5, boxShadow: "0 8px 32px rgba(0,0,0,0.7)", overflow: 'hidden', position: 'relative' }}>
                <CardContent sx={{ p: 3, flex: 1 }}>
                  {/* Customer Info */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
                        borderRadius: "50%",
                        p: 1,
                        mr: 2,
                        boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)",
                      }}
                    >
                      <Person sx={{ color: "white", fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.9)",
                        textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      }}
                    >
                      Customer & Cart
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
                    <Select
                      fullWidth
                      margin="normal"
                      label="Select Customer"
                      value={selectedCustomerId}
                      onChange={(e) => {
                        const customer = customerList.find(c => c.id === e.target.value);
                        setCustomer({ name: customer?.name || '', phone: customer?.phone || '', address: customer?.address || '' });
                        setSelectedCustomerId(e.target.value);
                      }}
                      displayEmpty
                      sx={{
                        mb: 3,
                        background: 'linear-gradient(90deg, #232526 0%, #414345 100%)',
                        borderRadius: 2.5,
                        boxShadow: '0 2px 12px 0 rgba(255,179,71,0.10)',
                        border: '2px solid #FFB347',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1.1rem',
                        '& .MuiSelect-icon': {
                          color: '#FFB347',
                          fontSize: 32,
                          right: 16,
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          border: 'none',
                        },
                        '&:hover': {
                          boxShadow: '0 4px 16px 0 #FFB34733',
                        },
                      }}
                      inputProps={{
                        style: {
                          padding: '14px 18px',
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: 'white',
                          background: 'transparent',
                          borderRadius: 10,
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            background: 'linear-gradient(90deg, #232526 0%, #414345 100%)',
                            color: 'white',
                            borderRadius: 2,
                            boxShadow: '0 8px 32px 0 #FFB34722',
                            '& .MuiMenuItem-root.Mui-selected': {
                              background: 'linear-gradient(90deg, #FFB347 0%, #FFD580 100%)',
                              color: '#232526',
                              fontWeight: 700,
                            },
                            '& .MuiMenuItem-root:hover': {
                              background: 'linear-gradient(90deg, #FFB34744 0%, #FFD58044 100%)',
                              color: '#232526',
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        <span style={{ color: '#B0BEC5' }}>Select Customer</span>
                      </MenuItem>
                      {customerList.map((customer) => (
                        <MenuItem key={customer.id} value={customer.id}>
                          <span style={{ fontWeight: 600, fontSize: '1.05rem', color: '#FFB347', marginRight: 8 }}>●</span>
                          {customer.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <Button
                      variant="contained"
                      onClick={() => setIsAddCustomerDialogOpen(true)}
                      sx={{
                        background: 'linear-gradient(45deg, #FFB347, #FFD700)',
                        color: '#232526',
                        fontWeight: 700,
                        minWidth: '160px',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #FFD700, #FFB347)'
                        }
                      }}
                      startIcon={<PersonAdd />}
                    >
                      Add Customer
                    </Button>
                  </Stack>
                  <AddCustomerDialog
                    open={isAddCustomerDialogOpen}
                    onClose={() => setIsAddCustomerDialogOpen(false)}
                    onCustomerAdded={(newCustomer) => {
                      setCustomerList(prev => [...prev, newCustomer]);
                      setCustomer({ name: newCustomer.name, phone: newCustomer.phone, address: newCustomer.address });
                      setSelectedCustomerId(newCustomer.id);
                      setSuccess('✨ Customer added successfully');
                    }}
                  />
                  {selectedCustomerId && (
                    <Box
                      sx={{
                        mt: 1,
                        p: 2,
                        background: 'linear-gradient(135deg, #232526 0%, #414345 100%)',
                        borderRadius: 2,
                        borderLeft: '6px solid #FFB347',
                        boxShadow: '0 2px 8px 0 rgba(255,179,71,0.10)',
                        position: 'relative',
                        overflow: 'hidden',
                        '::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          boxShadow: '0 0 32px 8px #FFB34744',
                          opacity: 0.18,
                          pointerEvents: 'none',
                          borderRadius: 2,
                        },
                      }}
                    >
                      <Typography variant="h5" sx={{ color: '#FFB347', fontWeight: 800, mb: 2, letterSpacing: 1, textShadow: '0 2px 8px #FFB34733' }}>
                        {customer.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                        <span style={{ color: '#90CAF9', marginRight: 8, display: 'flex', alignItems: 'center' }}>
                          <svg width="20" height="20" fill="#90CAF9" style={{ marginRight: 4 }} viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z"></path></svg>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#90CAF9', mr: 1 }}>Phone:</Typography>
                        </span>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>{customer.phone}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#CE93D8', marginRight: 8, display: 'flex', alignItems: 'center' }}>
                          <svg width="20" height="20" fill="#CE93D8" style={{ marginRight: 4 }} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path></svg>
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#CE93D8', mr: 1 }}>Address:</Typography>
                        </span>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>{customer.address}</Typography>
                      </Box>
                    </Box>
                  )}
                  {/* Shopping Cart (header, items, order summary, button) */}
                  <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(45deg, #FF6B6B, #4ECDC4)",
                          borderRadius: "50%",
                          p: 1,
                          mr: 2,
                          boxShadow: "0 4px 12px rgba(255, 107, 107, 0.4)",
                        }}
                      >
                        <ShoppingCart sx={{ color: "white", fontSize: 24 }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "rgba(255,255,255,0.9)",
                          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        Shopping Cart
                      </Typography>
                    </Box>
                    {/* Cart Items List */}
                    <Box sx={{ maxHeight: 340, overflowY: 'auto', background: 'rgba(255,255,255,0.01)', borderRadius: 2, mb: 2 }}>
                      {cart.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4, borderRadius: 2, background: 'rgba(255,255,255,0.03)' }}>
                          <ShoppingCart sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
                          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            Your cart is empty
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          {previousPendingItems.length > 0 && (
                            <Box sx={{ mb: 2, p: 2, background: 'rgba(255,183,77,0.1)', borderRadius: 2 }}>
                              <Typography variant="subtitle1" sx={{ color: '#FFB74D', mb: 1, fontWeight: 700 }}>
                                Previous Bills
                              </Typography>
                              {previousPendingItems.map((item, index) => (
                                <Box
                                  key={`${item.invoice_bill_number}-${index}`}
                                  sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 1.5,
                                    borderRadius: 1,
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    mb: 1,
                                    border: '1px solid rgba(255,183,77,0.2)'
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body2" sx={{ color: '#fff' }}>{item.description}</Typography>
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                      Bill #{item.invoice_bill_number}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="body2" sx={{ color: '#FFB74D', fontWeight: 700 }}>₹{item.total.toFixed(2)}</Typography>
                                    <Typography
                                      component="span"
                                      sx={{
                                        px: 1,
                                        py: 0.5,
                                        bgcolor: '#81C784',
                                        color: '#fff',
                                        borderRadius: 1,
                                        fontSize: '0.7rem',
                                        fontWeight: 700
                                      }}
                                    >
                                      PAID
                                    </Typography>
                                  </Box>

                                </Box>
                              ))}
                              <Divider sx={{ my: 2, borderColor: 'rgba(255,183,77,0.2)' }} />
                            </Box>
                          )}
                          {cart.map((item) => (
                            <Paper
                              key={item.id}
                              sx={{
                                p: 2,
                                mb: 2,
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(78,205,196,0.04) 100%)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 3,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'box-shadow 0.2s',
                                '&:hover': { boxShadow: '0 4px 16px rgba(78,205,196,0.12)' },
                              }}
                            >
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontWeight: 700, color: '#fff', fontSize: 16, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {item.name}
                                </Typography>
                                <Typography sx={{ color: '#b2dfdb', fontSize: 13, fontWeight: 500 }}>
                                  ₹{item.price} x {item.quantity}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                                <IconButton size="small" onClick={() => updateQuantity(item.id, -1)} sx={{ color: '#4ECDC4', '&:hover': { background: 'rgba(78,205,196,0.15)' } }}>
                                  <Remove fontSize="small" />
                                </IconButton>
                                <Typography sx={{ mx: 1, minWidth: 24, textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton size="small" onClick={() => updateQuantity(item.id, 1)} sx={{ color: '#4ECDC4', '&:hover': { background: 'rgba(78,205,196,0.15)' } }}>
                                  <Add fontSize="small" />
                                </IconButton>
                              </Box>

                              <Typography sx={{ fontWeight: 700, color: '#FFD700', ml: 3, minWidth: 70, textAlign: 'right', fontSize: 16 }}>
                                ₹{(item.price * item.quantity).toFixed(2)}
                              </Typography>
                              <IconButton size="small" onClick={() => removeFromCart(item.id)} sx={{ color: '#ff6b9d', ml: 1, '&:hover': { background: 'rgba(255,107,157,0.12)' } }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </Paper>
                          ))}
                        </Box>
                      )}
                    </Box>


                    {/* Order Summary Section */}
                    <Box sx={{ p: 3, background: 'linear-gradient(90deg, #232526 0%, #414345 100%)', borderTop: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 -2px 8px rgba(0,0,0,0.10)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFD700', mb: 2, letterSpacing: 1 }}>
                        Order Summary
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Subtotal:</Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 700 }}>₹{subtotal.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>Tax (5%):</Typography>
                          <Typography sx={{ color: '#fff', fontWeight: 700 }}>₹{tax.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography sx={{ color: '#4CAF50', fontWeight: 700 }}>Discount (2%):</Typography>
                          <Typography sx={{ color: '#4CAF50', fontWeight: 700 }}>-₹{discount.toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#FFD700', fontSize: 20 }}>
                            Total:
                          </Typography>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#FFD700', fontSize: 20 }}>
                            ₹{total.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <FlashOn />}
                        onClick={handleSubmit}
                        disabled={submitting || cart.length === 0 || !customer.name.trim()}
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: 18,
                          letterSpacing: 1,
                          boxShadow: '0 2px 8px rgba(255,107,157,0.10)',
                          mt: 2,
                          '&:hover': {
                            background: 'linear-gradient(45deg, #4ECDC4, #FF6B6B)',
                          },
                          '&.Mui-disabled': {
                            background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.4)',
                          },
                        }}
                      >
                        {submitting ? 'Processing...' : 'Generate Invoice'}
                      </Button>
                      {thankYouMessage && (
                        <Typography variant="subtitle2" sx={{ mt: 2, color: '#4CAF50', fontWeight: 700 }}>
                          {thankYouMessage}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Available Products */}
          <Box sx={{ mt: 4 }}>
            <Slide direction="left" in timeout={1800}>
              <Card
                sx={{
                  background: "linear-gradient(135deg, rgba(30,30,30,0.9) 0%, rgba(45,45,45,0.8) 100%)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 4,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  mb: 3,
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <Box
                      sx={{
                        background: "linear-gradient(45deg, #A8E6CF, #DCEDC8)",
                        borderRadius: "50%",
                        p: 1,
                        mr: 2,
                        boxShadow: "0 4px 12px rgba(168, 230, 207, 0.4)",
                      }}
                    >
                      <Inventory sx={{ color: "#2E7D32", fontSize: 24 }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: "white",
                        textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      Available Products ({allItems.length})
                    </Typography>
                  </Box>

                  {loading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                      <CircularProgress
                        size={60}
                        sx={{
                          color: "#4ECDC4",
                          "& .MuiCircularProgress-circle": {
                            strokeLinecap: "round",
                          },
                        }}
                      />
                    </Box>
                  ) : items.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 6 }}>
                      <Box
                        sx={{
                          background: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
                          borderRadius: "50%",
                          width: 80,
                          height: 80,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mx: "auto",
                          mb: 2,
                        }}
                      >
                        <Inventory sx={{ fontSize: 40, color: "rgba(255,255,255,0.6)" }} />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "rgba(255,255,255,0.8)",
                          fontWeight: 500,
                          mb: 1,
                        }}
                      >
                        {searchTerm ? "No items found" : "No items available"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        {searchTerm ? "Try a different search term" : "Add some products to get started"}
                      </Typography>
                    </Box>
                  ) : (
                    <>
                      <Grid container spacing={2} sx={{ mb: 3, justifyContent: 'center' }}>
                        {paginatedItems.map((product) => (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                            <ProductCard
                              product={product}
                              onAdd={addToCart}
                              darkMode
                              sx={{ height: '100%' }} // Ensure all cards take full height of the grid item
                            />
                          </Grid>
                        ))}
                      </Grid>
                      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                        <Pagination
                          count={totalPages}
                          page={productPage}
                          onChange={(_, value) => setProductPage(value)}
                          color="primary"
                          shape="rounded"
                          size="large"
                          sx={{
                            "& .MuiPaginationItem-root": {
                              color: "white",
                              borderColor: "rgba(255,255,255,0.3)",
                            },
                            "& .MuiPaginationItem-root.Mui-selected": {
                              backgroundColor: "rgba(255,255,255,0.2)",
                              color: "white",
                            },
                            "& .MuiPaginationItem-root:hover": {
                              backgroundColor: "rgba(255,255,255,0.1)",
                            },
                          }}
                        />
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Slide>
          </Box>
        </Box>

        {/* Snackbar for notifications */}
        <Snackbar
          open={!!error || !!success}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={error ? "error" : "success"}
            sx={{
              width: "100%",
              borderRadius: 3,
              fontWeight: 600,
              boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
              backdropFilter: "blur(10px)",
              background: error
                ? "linear-gradient(135deg, rgba(255,82,82,0.9), rgba(211,47,47,0.9))"
                : "linear-gradient(135deg, rgba(76,175,80,0.9), rgba(56,142,60,0.9))",
              color: "white",
              "& .MuiAlert-icon": {
                color: "white",
              },
            }}
          >
            {error || success}
          </Alert>
        </Snackbar>
        {/* Pending amount warning after invoice creation */}
        {pendingAmount !== undefined && pendingAmount !== null && !isNaN(Number(pendingAmount)) && (
          <Alert severity="warning" sx={{ mt: 2, fontWeight: 600, borderRadius: 2 }}>
            You have a pending invoice. The previous pending amount ₹{Number(pendingAmount).toFixed(2)} has been added to your new invoice.
          </Alert>
        )}
      </Container>
    </Box>
  );
};

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : "0, 0, 0";
}

export default CreateInvoicePage;