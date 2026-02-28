import { useEffect, useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiClient } from './api';
import { 
  Table, TableBody, TableCell, TableHead, TableRow, 
  Button, TextField, Paper, Typography, Box, TablePagination 
} from '@mui/material';

export default function App() {
  const [orders, setOrders] = useState<any[]>([]);
  const [formData, setFormData] = useState({ lat: '', lon: '', subtotal: '' });
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchOrders = useCallback(() => {
    apiClient.get('/orders?page=1&pageSize=1000') 
      .then(res => setOrders(res.data.items || res.data || []))
      .catch(err => console.error("Помилка завантаження:", err));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  
  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => 
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
    }
  };

  const onDrop = useCallback(async (acceptedFiles: any[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const data = new FormData();
    data.append('file', file);
    try {
      await apiClient.post('/orders/import', data);
      fetchOrders();
      alert('Файл успішно завантажено!');
    } catch (error) {
      alert('Помилка завантаження файлу.');
    }
  }, [fetchOrders]);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Box sx={{ p: 4, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        ByteStorm : Адмін-панель податків
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, flex: 1, minWidth: '350px' }}>
          <Typography variant="h6" gutterBottom>Створити замовлення вручну</Typography>
          <form onSubmit={handleManualCreate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <TextField label="Latitude" value={formData.lat} onChange={(e: any) => setFormData({...formData, lat: e.target.value})} required size="small" />
            <TextField label="Longitude" value={formData.lon} onChange={(e: any) => setFormData({...formData, lon: e.target.value})} required size="small" />
            <TextField label="Subtotal" type="number" value={formData.subtotal} onChange={(e: any) => setFormData({...formData, subtotal: e.target.value})} required size="small" />
            <Button type="submit" variant="contained">РОЗРАХУВАТИ ТА ЗБЕРЕГТИ</Button>
          </form>
        </Paper>

        <Paper {...getRootProps()} sx={{ 
          p: 3, border: '2px dashed #1976d2', flex: 1, minWidth: '300px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
        }}>
          <input {...getInputProps()} />
          <Typography align="center" color="primary">Перетягни сюди CSV файл або клікніть для вибору</Typography>
        </Paper>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Список замовлень</Typography>
          <TextField 
            label="Пошук за ID або Юрисдикцією" 
            variant="outlined" 
            size="small" 
            sx={{ width: '300px' }}
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
          />
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
            {currentTableData.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell sx={{ fontSize: '0.75rem' }}>{o.id?.substring(0, 8)}...</TableCell>
                <TableCell>${o.subtotal?.toFixed(2)}</TableCell>
                <TableCell>{(o.compositeTaxRate * 100).toFixed(3)}%</TableCell>
                <TableCell sx={{ color: 'green' }}>${o.taxAmount?.toFixed(2)}</TableCell>
                <TableCell><b>${o.totalAmount?.toFixed(2)}</b></TableCell>
                <TableCell>{o.jurisdictions?.join(', ')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredOrders.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>
    </Box>
  );
}