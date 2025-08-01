import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

export const getInvoices = () => axios.get(`${API_BASE_URL}/invoices/`);
export const createInvoice = (data) => axios.post(`${API_BASE_URL}/invoices/`, data);
export const updateInvoice = (id, data) => axios.patch(`${API_BASE_URL}/invoices/${id}/`, data);
export const deleteInvoice = (id) => axios.delete(`${API_BASE_URL}/invoices/${id}/`);
export const getInvoicePdf = (id) => axios.get(`${API_BASE_URL}/invoices/${id}/pdf/`, { responseType: 'arraybuffer' });

export const getItems = () => axios.get(`${API_BASE_URL}/items/`);
export const createItem = (data) => axios.post(`${API_BASE_URL}/items/`, data);
export const updateItem = (id, data) => axios.patch(`${API_BASE_URL}/items/${id}/`, data);
export const deleteItem = (id) => axios.delete(`${API_BASE_URL}/items/${id}/`);

// Restore searchItems for item search functionality
export const searchItems = (search = '') => axios.get(`${API_BASE_URL}/items/?search=${search}`);

// Customer API
export const getCustomers = () => axios.get(`${API_BASE_URL}/customers/`);
export const createCustomer = (data) => axios.post(`${API_BASE_URL}/customers/`, data);
export const updateCustomer = (id, data) => axios.patch(`${API_BASE_URL}/customers/${id}/`, data);
export const deleteCustomer = (id) => axios.delete(`${API_BASE_URL}/customers/${id}/`);

export const getSalesReport = (days = 7) => axios.get(`${API_BASE_URL}/sales-report/?days=${days}`);

// Authentication
export const signup = (data) => axios.post(`${API_BASE_URL}/auth/signup/`, data);
export const login = (data) => axios.post(`${API_BASE_URL}/auth/login/`, data);