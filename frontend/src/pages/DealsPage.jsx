import React, { useState } from 'react';
import { useDeals } from '../hooks/useDeals';
import { FixedSizeList as List } from 'react-window';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Container,
  Chip,
  Link
} from '@mui/material';

// Helper to get platform-specific colors for the chips
const getPlatformChipStyle = (platform) => {
  switch (platform.toLowerCase()) {
    case 'amazon':
      return { backgroundColor: '#FF9900', color: 'white' };
    case 'flipkart':
      return { backgroundColor: '#2874F0', color: 'white' };
    case 'jiomart':
      return { backgroundColor: '#D32F2F', color: 'white' };
    default:
      return { backgroundColor: '#e0e0e0', color: 'black' };
  }
};

const DealsPage = () => {
  const [filters, setFilters] = useState({ type: '', minDiscount: '', platform: '' });
  const { data: deals, isLoading, error } = useDeals(filters);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // --- Row Component for Virtualized List ---
  // This component renders a single row. `react-window` clones this element for each visible row.
  const Row = ({ index, style }) => {
    const deal = deals[index];
    return (
      <TableRow style={style} key={deal._id} hover component="div" sx={{ '&:last-child td, &:last-child th': { border: 0 }, display: 'flex' }}>
        <TableCell component="div" sx={{ width: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img
            src={deal.image || 'https://placehold.co/80x80/eee/ccc?text=N/A'}
            alt={deal.title}
            style={{ width: 80, height: 80, objectFit: 'contain', borderRadius: '4px' }}
            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/80x80/eee/ccc?text=N/A'; }}
          />
        </TableCell>
        <TableCell component="div" sx={{ width: '35%', wordBreak: 'break-word', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center' }}>
          <Link href={deal.link} target="_blank" rel="noopener noreferrer" underline="hover" color="inherit">
            {deal.title}
          </Link>
        </TableCell>
        <TableCell align="center" component="div" sx={{ width: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chip label={`${deal.discount}%`} color="success" size="small" sx={{ fontWeight: 'bold' }} />
        </TableCell>
        <TableCell align="right" component="div" sx={{ width: '10%', textDecoration: 'line-through', color: 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {deal.mrp}
        </TableCell>
        <TableCell align="right" component="div" sx={{ width: '10%', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          {deal.price}
        </TableCell>
        <TableCell align="center" component="div" sx={{ width: '10%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Chip label={deal.platform} size="small" sx={getPlatformChipStyle(deal.platform)} />
        </TableCell>
        <TableCell align="center" component="div" sx={{ width: '15%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            href={deal.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            View
          </Button>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
        Latest Deals
      </Typography>

      {/* --- Filters Section --- */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Typography variant="h6" gutterBottom>Filter Deals</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField label="Filter by type" name="type" value={filters.type} onChange={handleFilterChange} variant="outlined" fullWidth />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField label="Min discount (%)" name="minDiscount" type="number" value={filters.minDiscount} onChange={handleFilterChange} variant="outlined" fullWidth />
          </Grid>
          <Grid item xs={12} md={5}>
            <FormControl variant="outlined" fullWidth sx={{ m: 1, width: '10rem' }}>
              <InputLabel>Platform</InputLabel>
              <Select name="platform" value={filters.platform} onChange={handleFilterChange} label="Platform">
                <MenuItem value=""><em>All Platforms</em></MenuItem>
                <MenuItem value="flipkart">Flipkart</MenuItem>
                <MenuItem value="amazon">Amazon</MenuItem>
                <MenuItem value="jiomart">JioMart</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Typography color="error" align="center" sx={{ my: 5 }}>
          Error fetching deals: {error.message}
        </Typography>
      )}

      {/* --- Deals Table --- */}
      {!isLoading && !error && (
        <Paper elevation={2} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: '70vh' }}>
            <Table stickyHeader component="div" aria-label="deals table">
              <TableHead component="div">
                <TableRow component="div" sx={{ '& th': { backgroundColor: '#eef2f6', fontWeight: 'bold' }, display: 'flex' }}>
                  <TableCell component="div" sx={{ width: '10%' }}>Image</TableCell>
                  <TableCell component="div" sx={{ width: '35%' }}>Title</TableCell>
                  <TableCell component="div" align="center" sx={{ width: '10%' }}>Discount</TableCell>
                  <TableCell component="div" align="right" sx={{ width: '10%' }}>MRP</TableCell>
                  <TableCell component="div" align="right" sx={{ width: '10%' }}>Price</TableCell>
                  <TableCell component="div" align="center" sx={{ width: '10%' }}>Platform</TableCell>
                  <TableCell component="div" align="center" sx={{ width: '15%' }}>Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody component="div">
                {deals && deals.length > 0 ? (
                  <List
                    height={500} // Adjust this height based on your needs
                    itemCount={deals.length}
                    itemSize={100} // The height of each row
                    width="100%"
                  >
                    {Row}
                  </List>
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                      <Typography variant="body1" color="text.secondary">
                        No deals found for the selected filters.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Container>
  );
};

export default DealsPage;
