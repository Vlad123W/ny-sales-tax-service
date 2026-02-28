import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiClient } from './api';
import { 
  Table, TableBody, TableCell, TableHead, TableRow, 
  Button, TextField, Paper, Typography, Box, TablePagination,
  CircularProgress, Backdrop
} from '@mui/material';

interface Order {
  id: string;
  subtotal: number;
  compositeTaxRate: number;
  taxAmount: number;
  totalAmount: number;
  jurisdictions: string[];
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({ lat: '', lon: '', subtotal: '' });
  
  const [isLoading, setIsLoading] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchOrders = useCallback(() => {
    let url = `/orders?page=1&pageSize=1000`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    setIsLoading(true);
    apiClient.get(url) 
      .then(res => setOrders(res.data.items || res.data || []))
      .catch(err => console.error("Помилка завантаження:", err))
      .finally(() => setIsLoading(false));
  }, [startDate, endDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o: Order) => 
      o.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.jurisdictions?.join(' ').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const currentTableData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredOrders.slice(start, start + rowsPerPage);
  }, [filteredOrders, page, rowsPerPage]);

  const handleManualCreate = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/orders', {
        latitude: parseFloat(formData.lat),
        longitude: parseFloat(formData.lon),
        subtotal: parseFloat(formData.subtotal),
        timestamp: new Date().toISOString()
      });
      fetchOrders();
      setFormData({ lat: '', lon: '', subtotal: '' });
    } catch (error) {
      alert("Не вдалося створити замовлення.");
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: any[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setIsLoading(true);
    const data = new FormData();
    data.append('file', file);
    
    try {
      await apiClient.post('/orders/import', data);
      fetchOrders();
      alert('Файл успішно завантажено!');
    } catch (error) {
      alert('Помилка завантаження файлу.');
      setIsLoading(false);
    }
  }, [fetchOrders]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
        <CircularProgress color="inherit" />
        <Typography sx={{ ml: 2 }}>Обробка даних...</Typography>
      </Backdrop>

      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        ByteStorm : Адмін-панель податків
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: 1, minWidth: '350px', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" gutterBottom>Створити замовлення вручну</Typography>
          <form onSubmit={handleManualCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px', flexGrow: 1 }}>
            <TextField label="Latitude" value={formData.lat} onChange={(e: any) => setFormData({...formData, lat: e.target.value})} required size="small" disabled={isLoading} />
            <TextField label="Longitude" value={formData.lon} onChange={(e: any) => setFormData({...formData, lon: e.target.value})} required size="small" disabled={isLoading} />
            <TextField label="Subtotal" type="number" value={formData.subtotal} onChange={(e: any) => setFormData({...formData, subtotal: e.target.value})} required size="small" disabled={isLoading} />
            <Box sx={{ mt: 'auto' }}>
                <Button type="submit" variant="contained" fullWidth disabled={isLoading}>РОЗРАХУВАТИ ТА ЗБЕРЕГТИ</Button>
            </Box>
          </form>
        </Paper>

        <Paper {...getRootProps()} sx={{ 
          p: 3, border: isDragActive ? '2px solid #1976d2' : '2px dashed #1976d2', 
          flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', 
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          backgroundColor: isDragActive ? '#e3f2fd' : '#fff',
          transition: 'all 0.3s ease'
        }}>
          <input {...getInputProps()} disabled={isLoading} />
          {isLoading ? (
            <CircularProgress size={40} />
          ) : (
            <Typography align="center" color="primary">
              {isDragActive ? 'Відпустіть файл тут...' : 'Перетягніть сюди CSV файл або клікніть для вибору'}
            </Typography>
          )}
        </Paper>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h6">Список замовлень</Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField 
              label="Від (Дата)" type="date" size="small" 
              InputLabelProps={{ shrink: true }}
              value={startDate} onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField 
              label="До (Дата)" type="date" size="small" 
              InputLabelProps={{ shrink: true }}
              value={endDate} onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="outlined" onClick={fetchOrders} disabled={isLoading}>
              Застосувати
            </Button>

            <TextField 
              label="Пошук за ID або Юрисдикцією" variant="outlined" size="small" sx={{ width: '250px' }}
              value={searchTerm} onChange={(e: any) => { setSearchTerm(e.target.value); setPage(0); }}
            />
          </Box>
        </Box>

        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Ціна</b></TableCell>
              <TableCell><b>Ставка</b></TableCell>
              <TableCell><b>Податок</b></TableCell>
              <TableCell><b>Разом</b></TableCell>
              <TableCell><b>Юрисдикції</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentTableData.map((o: Order) => (
              <TableRow key={o.id} hover>
                <TableCell sx={{ fontSize: '0.75rem' }}>{o.id?.substring(0, 8)}...</TableCell>
                <TableCell>${o.subtotal?.toFixed(2)}</TableCell>
                <TableCell>{(o.compositeTaxRate * 100).toFixed(3)}%</TableCell>
                <TableCell sx={{ color: 'green' }}>${o.taxAmount?.toFixed(2)}</TableCell>
                <TableCell><b>${o.totalAmount?.toFixed(2)}</b></TableCell>
                <TableCell>{o.jurisdictions?.join(', ')}</TableCell>
              </TableRow>
            ))}
            {currentTableData.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3 }}>
                  Замовлень не знайдено
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage: number) => setPage(newPage)}
          onRowsPerPageChange={(e: any) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}