import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Grid,
  Fade,
  Slide,
  CircularProgress,
} from "@mui/material";
import {
  Edit,
  Delete,
  Search,
  Inventory,
} from "@mui/icons-material";
import { getItems, createItem, updateItem, deleteItem } from "../services/api";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import TableRowsIcon from "@mui/icons-material/TableRows";
import * as XLSX from 'xlsx';

const ItemsPage = () => {
  // const isMobile = useMediaQuery(theme.breakpoints.down("md")); // removed unused

  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("table");
  const [activeFilter, setActiveFilter] = useState("all");
  // const [cart, setCart] = useState([]); // Removed unused

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await getItems();
      console.log("Fetched items:", response.data); // Log the fetched data
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        price: item.price.toString(),
        stock: item.stock.toString(),
      });
    } else {
      setEditingItem(null);
      setFormData({ name: "", price: "", stock: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({ name: "", price: "", stock: "" });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.stock) {
      alert("Please fill in all fields");
      return;
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
      } else {
        const existing = items.find(
          (item) => item.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
        );
        if (existing) {
          const updatedData = {
            name: existing.name,
            price: formData.price,
            stock: (parseInt(existing.stock, 10) + parseInt(formData.stock, 10)).toString(),
          };
          await updateItem(existing.id, updatedData);
        } else {
          await createItem(formData);
        }
      }
      fetchItems();
      handleCloseDialog();
    } catch (error) {
      console.error("Error saving item:", error);
      alert("Error saving item. Please try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteItem(id);
        fetchItems();
      } catch (error) {
        console.error("Error deleting item:", error);
        alert("Error deleting item. Please try again.");
      }
    }
  };

  const handleFilterClick = (filterType) => {
    setActiveFilter(filterType);
    setSearchTerm(""); // Clear search when filter is applied
  };

  const getFilteredItems = () => {
    let filtered = items.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    switch (activeFilter) {
      case "lowStock":
        return filtered.filter((item) => item.stock <= 5);
      case "inStock":
        return filtered.filter((item) => item.stock > 5 && item.stock < 10);
      case "wellStocked":
        return filtered.filter((item) => item.stock > 10);
      case "all":
      default:
        return filtered;
    }
  };

  const filteredItems = getFilteredItems();

  // Import Items from CSV/Excel
  const handleImportItems = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      rows.forEach(async (row) => {
        if (row.name && row.price && row.stock) {
          try {
            await createItem({
              name: row.name,
              price: row.price,
              stock: row.stock,
            });
          } catch (err) {
            // Optionally handle duplicate or error
          }
        }
      });
      fetchItems();
    };
    reader.readAsBinaryString(file);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #121212 0%, #1E1E1E 100%)",
        py: 3,
        px: 2,
        color: "#ffffff",
      }}
    >
      <Container maxWidth="xl">
        <Fade in timeout={800}>
          <Box sx={{ mb: 6, textAlign: "center", mt: 10 }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: "#BB86FC",
                textShadow: "0 4px 8px rgba(187, 134, 252, 0.15)",
                mb: 2,
                letterSpacing: "1px",
              }}
            >
              📦 Inventory Management
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: "#CFD8DC",
                fontWeight: 300,
                letterSpacing: "0.5px",
              }}
            >
              Manage your product inventory and pricing efficiently
            </Typography>
          </Box>
        </Fade>

        <Slide direction="down" in timeout={1000}>
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleFilterClick("all")}
                sx={{
                  background: activeFilter === "all" 
                    ? "linear-gradient(135deg, #BB86FC 0%, #3700B3 100%)" 
                    : "linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                  borderRadius: "12px",
                  transition: "all 0.3s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 24px rgba(187, 134, 252, 0.2)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{ 
                      color: activeFilter === "all" ? "#FFFFFF" : "#BB86FC", 
                      fontWeight: 700, 
                      mb: 1 
                    }}
                  >
                    {items.length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: activeFilter === "all" ? "#FFFFFF" : "#B0BEC5" 
                  }}>
                    Total Items
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleFilterClick("inStock")}
                sx={{
                  background: activeFilter === "inStock" 
                    ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" 
                    : "linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                  borderRadius: "12px",
                  transition: "all 0.3s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 24px rgba(255, 215, 0, 0.2)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{ 
                      color: activeFilter === "inStock" ? "#FFFFFF" : "#FFD700", 
                      fontWeight: 700, 
                      mb: 1 
                    }}
                  >
                    {items.filter((item) => item.stock > 5 && item.stock < 10).length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: activeFilter === "inStock" ? "#FFFFFF" : "#B0BEC5" 
                  }}>
                    Stock 5-10
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleFilterClick("lowStock")}
                sx={{
                  background: activeFilter === "lowStock" 
                    ? "linear-gradient(135deg, #FF7597 0%, #B00020 100%)" 
                    : "linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                  borderRadius: "12px",
                  transition: "all 0.3s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 24px rgba(255, 117, 151, 0.2)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{ 
                      color: activeFilter === "lowStock" ? "#FFFFFF" : "#FF7597", 
                      fontWeight: 700, 
                      mb: 1 
                    }}
                  >
                    {items.filter((item) => item.stock <= 5).length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: activeFilter === "lowStock" ? "#FFFFFF" : "#B0BEC5" 
                  }}>
                    Low Stock (&le;5)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                onClick={() => handleFilterClick("wellStocked")}
                sx={{
                  background: activeFilter === "wellStocked" 
                    ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)" 
                    : "linear-gradient(135deg, #1E1E1E 0%, #2D2D2D 100%)",
                  boxShadow: "0 8px 16px rgba(0, 0, 0, 0.3)",
                  borderRadius: "12px",
                  transition: "all 0.3s",
                  cursor: "pointer",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 24px rgba(255, 215, 0, 0.2)",
                  },
                }}
              >
                <CardContent sx={{ textAlign: "center", py: 3 }}>
                  <Typography
                    variant="h4"
                    sx={{ 
                      color: activeFilter === "wellStocked" ? "#FFFFFF" : "#FFD700", 
                      fontWeight: 700, 
                      mb: 1 
                    }}
                  >
                    {items.filter((item) => item.stock > 10).length}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: activeFilter === "wellStocked" ? "#FFFFFF" : "#B0BEC5" 
                  }}>
                    In Stock (&gt;10)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Slide>

        <Card
          sx={{
            mb: 4,
            p: 2,
            background: "#1E1E1E",
            border: "1px solid #333",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {activeFilter !== "all" && (
            <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label={
                  activeFilter === "lowStock" 
                    ? "Showing: Low Stock Items (≤5)" 
                    : activeFilter === "inStock" 
                    ? "Showing: Stock 5-10 Items"
                    : activeFilter === "wellStocked"
                    ? "Showing: In Stock Items (>10)"
                    : "All Items"
                }
                sx={{
                  background: activeFilter === "lowStock" 
                    ? "linear-gradient(135deg, #FF7597 0%, #B00020 100%)"
                    : activeFilter === "inStock"
                    ? "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)"
                    : activeFilter === "wellStocked"
                    ? "linear-gradient(135deg, #03DAC6 0%, #018786 100%)"
                    : "linear-gradient(135deg, #BB86FC 0%, #3700B3 100%)",
                  color: "#FFFFFF",
                  fontWeight: 600,
                }}
              />
              <Button
                size="small"
                onClick={() => handleFilterClick("all")}
                sx={{
                  color: "#B0BEC5",
                  fontSize: "0.75rem",
                  "&:hover": {
                    color: "#FFFFFF",
                  },
                }}
              >
                Clear Filter
              </Button>
            </Box>
          )}
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <Search
                sx={{
                  mr: 1,
                  color: "#BB86FC",
                  fontSize: "28px",
                }}
              />
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search items by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  mr: 2,
                  background: "#2D2D2D",
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#444",
                    },
                    "&:hover fieldset": {
                      borderColor: "#BB86FC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#BB86FC",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#FFFFFF",
                  },
                  "& .MuiInputLabel-root": {
                    color: "#B0BEC5",
                  },
                }}
              />
              <Button
                variant="contained"
                onClick={() => handleOpenDialog()}
                sx={{
                  minWidth: "180px",
                  background: "linear-gradient(135deg, #BB86FC 0%, #3700B3 100%)",
                  color: "#FFFFFF",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(187, 134, 252, 0.3)",
                  px: 0,
                  py: 0.7,
                  fontSize: "1.5rem",
                  fontWeight: 1000,
                  textTransform: "none",
                  letterSpacing: "0.5px",
                }}
              >
                +
              </Button>
              <Button
                variant="contained"
                component="label"
                sx={{
                  minWidth: "180px",
                  background: "linear-gradient(135deg, #03DAC6 0%, #018786 100%)",
                  color: "#121212",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(3, 218, 198, 0.3)",
                  px: 0,
                  py: 0.7,
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  textTransform: "none",
                  letterSpacing: "0.5px",
                  ml: 2,
                }}
              >
                Import Items
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  hidden
                  onChange={handleImportItems}
                />
              </Button>
              <Box
                sx={{
                  ml: 2,
                  display: "flex",
                  bgcolor: "#2D2D2D",
                  borderRadius: "8px",
                }}
              >
                <IconButton
                  sx={{
                    bgcolor: viewMode === "table" ? "#BB86FC" : "transparent",
                    color: viewMode === "table" ? "#121212" : "#B0BEC5",
                    borderRadius: "8px 0 0 8px",
                    "&:hover": {
                      bgcolor: viewMode === "table" ? "#A25BFE" : "#333",
                    },
                  }}
                  onClick={() => setViewMode("table")}
                >
                  <TableRowsIcon />
                </IconButton>
                <IconButton
                  sx={{
                    bgcolor: viewMode === "card" ? "#BB86FC" : "transparent",
                    color: viewMode === "card" ? "#121212" : "#B0BEC5",
                    borderRadius: "0 8px 8px 0",
                    "&:hover": {
                      bgcolor: viewMode === "card" ? "#A25BFE" : "#333",
                    },
                  }}
                  onClick={() => setViewMode("card")}
                >
                  <ViewModuleIcon />
                </IconButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress size={60} sx={{ color: "#BB86FC" }} />
          </Box>
        ) : filteredItems.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 10,
              bgcolor: "#1E1E1E",
              borderRadius: "12px",
              border: "1px dashed #444",
            }}
          >
            <Inventory
              sx={{
                fontSize: 64,
                color: "#BB86FC",
                mb: 2,
                opacity: 0.8,
              }}
            />
            <Typography variant="h5" sx={{ color: "#CFD8DC", mb: 1 }}>
              {searchTerm ? "No items found" : "No Items Available"}
            </Typography>
            <Typography variant="body1" sx={{ color: "#B0BEC5" }}>
              {searchTerm
                ? "Try adjusting your search terms."
                : "Add your first item to get started."}
            </Typography>
          </Box>
        ) : viewMode === "table" ? (
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: "#1E1E1E",
              border: "1px solid #333",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#2D2D2D" }}>
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: "#BB86FC",
                      fontSize: "1rem",
                    }}
                  >
                    Item
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color: "#BB86FC",
                      fontSize: "1rem",
                    }}
                  >
                    Price
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 700,
                      color: "#BB86FC",
                      fontSize: "1rem",
                    }}
                  >
                    Stock
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      color: "#BB86FC",
                      fontSize: "1rem",
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredItems.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    sx={{
                      bgcolor: idx % 2 === 0 ? "#1E1E1E" : "#252525",
                      transition: "background 0.3s",
                      "&:hover": {
                        bgcolor: "#2D2D2D",
                      },
                      borderBottom: "1px solid #333",
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 600,
                          color: "#FFFFFF",
                        }}
                      >
                        {item.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`₹${parseFloat(item.price).toFixed(2)}`}
                        sx={{
                          background: "#3700B3",
                          color: "#FFFFFF",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          px: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={item.stock}
                        sx={{
                          background:
                            item.stock > 10
                              ? "#018786"
                              : item.stock > 5
                              ? "#FFD700"
                              : "#B00020",
                          color: item.stock > 5 && item.stock <= 10 ? "#000000" : "#FFFFFF",
                          fontWeight: 700,
                          fontSize: "0.875rem",
                          px: 1,
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(item)}
                        sx={{
                          color: "#BB86FC",
                          bgcolor: "#2D2D2D",
                          mr: 1,
                          "&:hover": {
                            bgcolor: "#3700B3",
                          },
                        }}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(item.id)}
                        sx={{
                          color: "#FF7597",
                          bgcolor: "#2D2D2D",
                          mr: 1,
                          "&:hover": {
                            bgcolor: "#B00020",
                          },
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {filteredItems.map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                <Card sx={{
                  width: 260,
                  minHeight: 240,
                  mx: 'auto',
                  background: 'rgba(30, 30, 30, 0.7)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.18)',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 40px rgba(187, 134, 252, 0.15)',
                  },
                }}>
                  <CardContent sx={{ 
                    p: 3,
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: '"Poppins", sans-serif',
                          fontWeight: 600,
                          color: "#FFFFFF",
                          lineHeight: 1.3,
                          flexGrow: 1,
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Chip
                        label={`₹${parseFloat(item.price).toFixed(2)}`}
                        sx={{
                          background: 'rgba(55, 0, 179, 0.3)',
                          color: '#BB86FC',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          border: '1px solid rgba(187, 134, 252, 0.3)',
                          ml: 1,
                        }}
                      />
                    </Box>

                    <Box sx={{ mt: 'auto' }}>
                      <Chip
                        label={`Stock: ${item.stock}`}
                        sx={{
                          background: item.stock > 10
                            ? 'rgba(1, 135, 134, 0.2)'
                            : item.stock > 5
                            ? 'rgba(255, 215, 0, 0.2)'
                            : 'rgba(176, 0, 32, 0.2)',
                          color: item.stock > 10
                            ? '#03DAC6'
                            : item.stock > 5
                            ? '#FFD700'
                            : '#FF7597',
                          fontWeight: 600,
                          border: '1px solid',
                          borderColor: item.stock > 10
                            ? 'rgba(3, 218, 198, 0.3)'
                            : item.stock > 5
                            ? 'rgba(255, 215, 0, 0.3)'
                            : 'rgba(255, 117, 151, 0.3)',
                          width: '100%',
                          mb: 2,
                        }}
                      />
                    </Box>

                    <Box sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 1,
                      mt: 2,
                    }}>
                      <IconButton
                        onClick={() => handleOpenDialog(item)}
                        sx={{ 
                          flex: 1,
                          color: '#BB86FC',
                          background: 'rgba(187, 134, 252, 0.1)',
                          border: '1px solid rgba(187, 134, 252, 0.2)',
                          borderRadius: '8px',
                          '&:hover': {
                            background: 'rgba(187, 134, 252, 0.2)',
                          }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(item.id)}
                        sx={{ 
                          flex: 1,
                          color: '#FF7597',
                          background: 'rgba(255, 117, 151, 0.1)',
                          border: '1px solid rgba(255, 117, 151, 0.2)',
                          borderRadius: '8px',
                          '&:hover': {
                            background: 'rgba(255, 117, 151, 0.2)',
                          }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                      
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: "#1E1E1E",
              color: "#FFFFFF",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            },
          }}
        >
          <DialogTitle
            sx={{
              color: "#BB86FC",
              fontWeight: 700,
              fontSize: "1.5rem",
              borderBottom: "1px solid #333",
            }}
          >
            {editingItem ? "Edit Item" : "Add New Item"}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                margin="normal"
                required
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#444",
                    },
                    "&:hover fieldset": {
                      borderColor: "#BB86FC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#BB86FC",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#FFFFFF",
                  },
                  "& .MuiInputLabel-root": {
                    color: "#B0BEC5",
                  },
                }}
              />
              <TextField
                fullWidth
                label="Price (₹)"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                margin="normal"
                required
                inputProps={{ min: 0, step: 0.01 }}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#444",
                    },
                    "&:hover fieldset": {
                      borderColor: "#BB86FC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#BB86FC",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#FFFFFF",
                  },
                  "& .MuiInputLabel-root": {
                    color: "#B0BEC5",
                  },
                }}
              />
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                margin="normal"
                required
                inputProps={{ min: 0 }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": {
                      borderColor: "#444",
                    },
                    "&:hover fieldset": {
                      borderColor: "#BB86FC",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#BB86FC",
                    },
                  },
                  "& .MuiInputBase-input": {
                    color: "#FFFFFF",
                  },
                  "& .MuiInputLabel-root": {
                    color: "#B0BEC5",
                  },
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions
            sx={{
              borderTop: "1px solid #333",
              px: 3,
              py: 2,
            }}
          >
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: "#B0BEC5",
                fontWeight: 600,
                "&:hover": {
                  color: "#FFFFFF",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                background: "linear-gradient(135deg, #BB86FC 0%, #3700B3 100%)",
                color: "#FFFFFF",
                fontWeight: 600,
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(187, 134, 252, 0.2)",
                px: 3,
                py: 1,
                "&:hover": {
                  background: "linear-gradient(135deg, #A25BFE 0%, #2A00A0 100%)",
                  boxShadow: "0 6px 12px rgba(187, 134, 252, 0.3)",
                },
              }}
            >
              {editingItem ? "Update" : "Add"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Removed cart section as setCart was removed */}
      </Container>
    </Box>
  );
};

export default ItemsPage;