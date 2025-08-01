import React, { useState, useEffect, useCallback } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  Stack,
  Skeleton,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from "@mui/material";
import {
  Assessment,
  TrendingUp,
  AttachMoney,
  ShoppingCart,
  Inventory,
  Refresh,
  Download,
  PictureAsPdf,
  InsertDriveFile,
  FilterAlt,
  Close,
} from "@mui/icons-material";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import moment from "moment";
import { getInvoices, getItems, getInvoicePdf } from "../services/api";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

// Create dark theme
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#90caf9",
      contrastText: "#121212",
    },
    secondary: {
      main: "#f48fb1",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#f5f5f5",
      secondary: "#b0b0b0",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.5px",
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

const ReportPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [reportAnchorEl, setReportAnchorEl] = useState(null);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [invoicesResponse, itemsResponse] = await Promise.all([
        getInvoices(),
        getItems(),
      ]);
      setInvoices(invoicesResponse.data);
      setFilteredInvoices(invoicesResponse.data);
      setItems(itemsResponse.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Handle PDF opening
  const handleOpenPDF = async (invoiceId) => {
    try {
      const response = await getInvoicePdf(invoiceId);
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error opening PDF:", error);
      alert("Failed to open PDF. Please try again.");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let result = [...invoices];

    // Date range filter
    if (dateRange.start && dateRange.end) {
      result = result.filter((invoice) => {
        const invoiceDate = new Date(invoice.created_at);
        return (
          invoiceDate >= new Date(dateRange.start) &&
          invoiceDate <= new Date(dateRange.end)
        );
      });
    }

    // Status filter
    if (selectedStatus !== "all") {
      result = result.filter((invoice) => invoice.status === selectedStatus);
    }

    // Amount range filter
    if (minAmount) {
      result = result.filter(
        (invoice) => parseFloat(invoice.total) >= parseFloat(minAmount)
      );
    }
    if (maxAmount) {
      result = result.filter(
        (invoice) => parseFloat(invoice.total) <= parseFloat(maxAmount)
      );
    }

    setFilteredInvoices(result);
    setFilterAnchorEl(null);
  }, [invoices, dateRange, selectedStatus, minAmount, maxAmount]);

  // Reset filters
  const resetFilters = useCallback(() => {
    setDateRange({ start: null, end: null });
    setSelectedStatus("all");
    setMinAmount("");
    setMaxAmount("");
    setFilteredInvoices(invoices);
    setFilterAnchorEl(null);
  }, [invoices]);

  // Generate PDF report
  const generatePDFReport = () => {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(20);
    doc.text("Sales Report", 105, 20, { align: "center" });

    // Date range
    doc.setFontSize(12);
    doc.text(
      `Date Range: ${
        dateRange.start
          ? moment(dateRange.start).format("MMM D, YYYY")
          : "All time"
      } - ${
        dateRange.end ? moment(dateRange.end).format("MMM D, YYYY") : "Present"
      }`,
      14,
      30
    );

    // Summary stats
    doc.setFontSize(14);
    doc.text(
      "Summary Statistics (Revenue & AOV exclude cancelled invoices)",
      14,
      45
    );

    const totalRevenue = activeInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.total || 0),
      0
    );
    const totalInvoices = filteredInvoices.length; // Include all invoices (including cancelled)
    const averageOrderValue =
      activeInvoices.length > 0 ? totalRevenue / activeInvoices.length : 0;

    const summaryData = [
      ["Total Revenue", `₹${totalRevenue}`],
      [
        "Total Revenue",
        `₹${new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 2,
        }).format(totalRevenue)}`,
      ],
      ["Total Invoices", totalInvoices],
      ["Average Order Value", `₹${averageOrderValue.toFixed(2)}`],
    ];

    doc.autoTable({
      startY: 50,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: "grid",
      headStyles: { fillColor: [100, 202, 249] },
    });

    // Top selling items
    const itemSales = {};
    activeInvoices.forEach((invoice) => {
      invoice.items?.forEach((item) => {
        const itemName = item.item?.name || "Unknown";
        itemSales[itemName] = (itemSales[itemName] || 0) + item.quantity;
      });
    });

    const topSellingItems = Object.entries(itemSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    doc.setFontSize(14);
    doc.text("Top Selling Items", 14, doc.autoTable.previous.finalY + 15);

    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [["Product", "Units Sold"]],
      body: topSellingItems.map(([name, quantity]) => [name, quantity]),
      theme: "grid",
      headStyles: { fillColor: [244, 143, 177] },
    });

    // Recent transactions
    doc.setFontSize(14);
    doc.text("Recent Transactions", 14, doc.autoTable.previous.finalY + 15);

    const transactionsData = filteredInvoices
      .slice(0, 10)
      .map((invoice) => [
        `#${invoice.bill_number}`,
        moment(invoice.created_at).format("MMM D, YYYY"),
        `₹${parseFloat(invoice.total || 0).toFixed(2)}`,
        invoice.status,
      ]);

    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [["Invoice", "Date", "Amount", "Status"]],
      body: transactionsData,
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50] },
    });

    doc.save(`sales-report-${moment().format("YYYY-MM-DD")}.pdf`);
    setReportAnchorEl(null);
  };

  // Generate Excel report
  const generateExcelReport = () => {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const totalRevenue = activeInvoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.total || 0),
      0
    );
    const totalInvoices = filteredInvoices.length; // Include all invoices (including cancelled)
    const averageOrderValue =
      activeInvoices.length > 0 ? totalRevenue / activeInvoices.length : 0;

    const summaryData = [
      ["Metric", "Value"],
      ["Total Revenue", `₹${totalRevenue.toLocaleString()}`],
      ["Total Invoices", totalInvoices],
      ["Average Order Value", `₹${averageOrderValue.toFixed(2)}`],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

    // Top selling items sheet
    const itemSales = {};
    activeInvoices.forEach((invoice) => {
      invoice.items?.forEach((item) => {
        const itemName = item.item_name || item.item?.name || "Unknown";
        itemSales[itemName] = (itemSales[itemName] || 0) + item.quantity;
      });
    });

    const topSellingItems = Object.entries(itemSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const itemsData = [
      ["Product", "Units Sold"],
      ...topSellingItems.map(([name, quantity]) => [name, quantity]),
    ];

    const itemsSheet = XLSX.utils.aoa_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(workbook, itemsSheet, "Top Products");

    // Detailed Bill Information sheet (including cancelled invoices for reference)
    const detailedBillData = [
      [
        "Bill Number",
        "Bill Date",
        "Bill Amount (₹)",
        "Status",
        "Items",
        "Item Quantities",
        "Item Prices",
      ],
    ];

    filteredInvoices.forEach((invoice) => {
      const items = invoice.items || [];
      const itemNames = items
        .map((item) => item.item_name || item.item?.name || "Unknown")
        .join("; ");
      const itemQuantities = items.map((item) => item.quantity || 0).join("; ");
      const itemPrices = items
        .map((item) => `₹${parseFloat(item.price || 0).toFixed(2)}`)
        .join("; ");

      detailedBillData.push([
        `#${invoice.bill_number}`,
        moment(invoice.created_at).format("MMM D, YYYY"),
        parseFloat(invoice.total || 0).toFixed(2),
        invoice.status,
        itemNames || "No items",
        itemQuantities || "0",
        itemPrices || "₹0.00",
      ]);
    });

    const detailedBillSheet = XLSX.utils.aoa_to_sheet(detailedBillData);
    XLSX.utils.book_append_sheet(workbook, detailedBillSheet, "All Bills");

    // Transactions sheet (simplified) - including cancelled invoices for reference
    const transactionsData = [
      ["Invoice", "Date", "Amount", "Status", "Items"],
      ...filteredInvoices.map((invoice) => [
        `#${invoice.bill_number}`,
        moment(invoice.created_at).format("MMM D, YYYY"),
        parseFloat(invoice.total || 0),
        invoice.status,
        invoice.items
          ?.map((item) => item.item_name || item.item?.name)
          .join(", ") || "No items",
      ]),
    ];

    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, "Transactions");

    // Generate and save file
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const data = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(data, `sales-report-${moment().format("YYYY-MM-DD")}.xlsx`);
    setReportAnchorEl(null);
  };

  // Filter out cancelled invoices for calculations
  const activeInvoices = filteredInvoices.filter(
    (invoice) => invoice.status !== "cancelled"
  );

  // Calculate statistics based on filtered data (excluding cancelled invoices)
  const totalRevenue = activeInvoices.reduce(
    (sum, invoice) => sum + parseFloat(invoice.total || 0),
    0
  );
  const totalInvoices = filteredInvoices.length; // Include all invoices (including cancelled)
  const totalItems = items.length;
  const averageOrderValue =
    activeInvoices.length > 0 ? totalRevenue / activeInvoices.length : 0;

  // Get top selling items from filtered data (excluding cancelled invoices)
  const itemSales = {};
  activeInvoices.forEach((invoice) => {
    invoice.items?.forEach((item) => {
      const itemName = item.item_name || item.item?.name || "Unknown";
      itemSales[itemName] = (itemSales[itemName] || 0) + item.quantity;
    });
  });

  const topSellingItems = Object.entries(itemSales)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Prepare chart data from filtered data (excluding cancelled invoices)
  const monthlyData = {};
  activeInvoices.forEach((invoice) => {
    const date = new Date(invoice.created_at);
    const monthYear = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    monthlyData[monthYear] =
      (monthlyData[monthYear] || 0) + parseFloat(invoice.total || 0);
  });

  const chartData = {
    labels: Object.keys(monthlyData).slice(-6),
    datasets: [
      {
        label: "Monthly Revenue",
        data: Object.values(monthlyData).slice(-6),
        borderColor: theme.palette.primary.main,
        backgroundColor: "rgba(144, 202, 249, 0.15)",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: theme.palette.primary.main,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Define different colors for each bar
  const barColors = [
    "rgba(144, 202, 249, 0.8)", // Blue
    "rgba(244, 143, 177, 0.8)", // Pink
    "rgba(129, 199, 132, 0.8)", // Green
    "rgba(255, 183, 77, 0.8)", // Orange
    "rgba(156, 39, 176, 0.8)", // Purple
  ];

  const barData = {
    labels: topSellingItems.map(([name]) => name),
    datasets: [
      {
        label: "Units Sold",
        data: topSellingItems.map(([, quantity]) => quantity),
        backgroundColor: topSellingItems.map(
          (_, index) => barColors[index % barColors.length]
        ),
        borderColor: topSellingItems.map((_, index) =>
          barColors[index % barColors.length].replace("0.8", "1")
        ),
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: theme.palette.text.primary,
          font: {
            weight: "500",
          },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.primary.main,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            return ` ₹${context.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => "₹" + value.toLocaleString(),
          padding: 8,
        },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.primary.main,
        bodyColor: theme.palette.text.primary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            return ` ${context.raw} units`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
        },
      },
      y: {
        grid: {
          color: theme.palette.divider,
          drawBorder: false,
        },
        ticks: {
          color: theme.palette.text.secondary,
          callback: (value) => value.toLocaleString(),
          padding: 8,
        },
      },
    },
  };

  if (loading && !refreshing) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          width: "100%",
          py: 3,
          mt: 10,
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Skeleton
              variant="rectangular"
              height={56}
              sx={{ mb: 2, borderRadius: 2 }}
            />
            <Skeleton variant="text" width="60%" height={32} />
          </Grid>

          {/* Metric Skeletons */}
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton
                variant="rectangular"
                height={150}
                sx={{ borderRadius: 2 }}
              />
            </Grid>
          ))}

          {/* Chart Skeletons */}
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={450}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={450}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton
              variant="rectangular"
              height={450}
              sx={{ borderRadius: 2 }}
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        py: 3,
        mt: 10,
        px: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          alignItems: isMobile ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: "linear-gradient(45deg, #90caf9, #f48fb1)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              lineHeight: 1.2,
            }}
          >
            Business Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Showing {filteredInvoices.length} of {invoices.length} invoices
            (calculations exclude cancelled invoices)
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: isMobile ? 2 : 0 }}>
          <Tooltip title="Refresh data">
            <IconButton
              onClick={handleRefresh}
              color="primary"
              disabled={refreshing}
              sx={{
                backgroundColor: theme.palette.background.paper,
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              <Refresh
                sx={{
                  transform: refreshing ? "rotate(360deg)" : "none",
                  transition: refreshing ? "transform 1s linear" : "none",
                }}
              />
            </IconButton>
          </Tooltip>

          <Tooltip title="Filter data">
            <Button
              variant="outlined"
              startIcon={<FilterAlt />}
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              sx={{
                textTransform: "none",
                backgroundColor: theme.palette.background.paper,
              }}
            >
              Filters
            </Button>
          </Tooltip>

          <Tooltip title="Export report">
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={(e) => setReportAnchorEl(e.currentTarget)}
              sx={{
                textTransform: "none",
              }}
            >
              Export
            </Button>
          </Tooltip>
        </Box>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchorEl}
        open={Boolean(filterAnchorEl)}
        onClose={() => setFilterAnchorEl(null)}
        PaperProps={{
          sx: {
            width: 350,
            p: 2,
          },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Date Range
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateRange.start || ""}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={dateRange.end || ""}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </Stack>

          <Typography variant="subtitle1" gutterBottom>
            Amount Range (₹)
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              label="Min Amount"
              type="number"
              size="small"
              fullWidth
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
            <TextField
              label="Max Amount"
              type="number"
              size="small"
              fullWidth
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
          </Stack>

          <Typography variant="subtitle1" gutterBottom>
            Status
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={selectedStatus}
              label="Status"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={resetFilters}
            startIcon={<Close />}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            onClick={applyFilters}
            startIcon={<FilterAlt />}
          >
            Apply
          </Button>
        </Stack>
      </Menu>

      {/* Report Generator Menu */}
      <Menu
        anchorEl={reportAnchorEl}
        open={Boolean(reportAnchorEl)}
        onClose={() => setReportAnchorEl(null)}
      >
        <MenuItem onClick={generatePDFReport}>
          <PictureAsPdf sx={{ mr: 1 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={generateExcelReport}>
          <InsertDriveFile sx={{ mr: 1 }} />
          Export as Excel
        </MenuItem>
      </Menu>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            icon: <AttachMoney sx={{ fontSize: 32 }} />,
            value: `₹${Number(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            label: "Total Revenue",
            color: "success.main",
          },
          {
            icon: <ShoppingCart sx={{ fontSize: 32 }} />,
            value: totalInvoices,
            label: "Total Invoices",
            color: "primary.main",
          },
          {
            icon: <TrendingUp sx={{ fontSize: 32 }} />,
            value: `₹${Number(averageOrderValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            label: "Avg. Order Value",
            color: "warning.main",
          },
          {
            icon: <Inventory sx={{ fontSize: 32 }} />,
            value: totalItems,
            label: "Total Products",
            color: "info.main",
          },
        ].map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index} sx={{ display: "flex" }}>
            <Card
              sx={{
                backgroundColor: "background.paper",
                height: 200,
                width: "100%",
                minWidth: 0,
                maxWidth: "100%",
                flex: 1,
                boxShadow: "none",
                border: `1px solid ${theme.palette.divider}`,
                overflow: "hidden",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 6px 12px rgba(0, 0, 0, 0.3)`,
                  transition: "all 0.3s ease",
                },
              }}
            >
              <CardContent
                sx={{
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  justifyContent: "space-between",
                  overflow: "hidden",
                  minHeight: 0,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    mb: 2,
                    gap: 1.5,
                  }}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "50%",
                      backgroundColor: `${metric.color}20`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {metric.icon}
                  </Box>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minHeight: 0,
                  }}
                >
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 700,
                      color: metric.color,
                      mb: 0.5,
                      fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {metric.value}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {metric.label}
                  </Typography>
                </Box>

                <Box sx={{ pt: 2 }}>
                  <Box
                    sx={{
                      height: 4,
                      width: "100%",
                      backgroundColor: `${metric.color}30`,
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: "70%",
                        backgroundColor: metric.color,
                        borderRadius: 2,
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              backgroundColor: "background.paper",
              boxShadow: "none",
              border: `1px solid ${theme.palette.divider}`,
              height: 450,
            }}
          >
            <CardContent sx={{ p: 3, height: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TrendingUp sx={{ mr: 1.5, color: "primary.main" }} />
                  <Typography variant="h6">Revenue Trend</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Last 6 Months
                </Typography>
              </Box>

              <Box sx={{ height: 300 }}>
                <Line data={chartData} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Selling Items */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              backgroundColor: "background.paper",
              boxShadow: "none",
              border: `1px solid ${theme.palette.divider}`,
              height: 450,
            }}
          >
            <CardContent sx={{ p: 3, height: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Assessment sx={{ mr: 1.5, color: "secondary.main" }} />
                  <Typography variant="h6">Top Selling Items</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  By quantity
                </Typography>
              </Box>

              <Box sx={{ height: 300 }}>
                <Bar data={barData} options={barChartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              backgroundColor: "background.paper",
              boxShadow: "none",
              border: `1px solid ${theme.palette.divider}`,
              height: 450,
            }}
          >
            <CardContent sx={{ p: 3, height: "100%" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 3,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Assessment sx={{ mr: 1.5, color: "primary.main" }} />
                  <Typography variant="h6">Recent Transactions</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Latest invoices
                </Typography>
              </Box>

              {filteredInvoices.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    border: `1px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                    height: 300,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Assessment
                    sx={{
                      fontSize: 48,
                      color: "text.secondary",
                      mb: 2,
                      opacity: 0.5,
                    }}
                  />
                  <Typography color="text.secondary">
                    No transactions found
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ height: 300, overflowY: "auto" }}>
                  {filteredInvoices.slice(0, 8).map((invoice) => (
                    <Tooltip title="Click to view PDF" placement="top">
                      <Box
                        key={invoice.id}
                        onClick={() => handleOpenPDF(invoice.id)}
                        sx={{
                          p: 2,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 2,
                          backgroundColor: "background.default",
                          mb: 2,
                          cursor: "pointer",
                          "&:hover": {
                            backgroundColor: "rgba(144, 202, 249, 0.08)",
                            borderColor: theme.palette.primary.main,
                            transform: "translateY(-2px)",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                          },
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color="primary"
                          >
                            #{invoice.bill_number}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                px: 1,
                                py: 0.5,
                                backgroundColor: theme.palette.action.selected,
                                borderRadius: 1,
                              }}
                            >
                              {moment(invoice.created_at).format("MMM D")}
                            </Typography>
                            <PictureAsPdf
                              sx={{
                                fontSize: 16,
                                color: "primary.main",
                                opacity: 0.7,
                              }}
                            />
                          </Box>
                        </Box>

                        <Typography
                          variant="h6"
                          fontWeight={700}
                          sx={{ mb: 1 }}
                        >
                          ₹{parseFloat(invoice.total || 0).toFixed(2)}
                        </Typography>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Box
                            sx={{
                              height: 6,
                              width: 6,
                              borderRadius: "50%",
                              backgroundColor:
                                invoice.status === "paid"
                                  ? "success.main"
                                  : invoice.status === "pending"
                                  ? "warning.main"
                                  : "error.main",
                            }}
                          />
                          <Typography
                            variant="caption"
                            textTransform="capitalize"
                          >
                            {invoice.status}
                          </Typography>
                        </Box>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {invoice.items
                            ?.map((item) => item.item_name || item.item?.name)
                            .join(", ") || "No items"}
                        </Typography>
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

// Wrap the component with ThemeProvider
const ReportsPage = () => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <ReportPage />
  </ThemeProvider>
);

export default ReportsPage;
