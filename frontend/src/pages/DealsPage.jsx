// frontend/src/pages/DealsPage.jsx


import React, { useState, useMemo } from 'react';
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
  Link,
  TableSortLabel
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';


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

// Helper function for stable sorting
function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator(a, b, orderBy) {
  // Helper to clean and parse numeric values from strings like '₹1,999'
  const cleanAndParse = (value) => {
    if (typeof value !== 'string') return value;
    return parseFloat(value.replace(/[₹,]/g, ''));
  };

  let valA = a[orderBy];
  let valB = b[orderBy];

  if (orderBy === 'price' || orderBy === 'mrp' || orderBy === 'discount') {
    valA = cleanAndParse(valA);
    valB = cleanAndParse(valB);
  }

  if (valB < valA) {
    return -1;
  }
  if (valB > valA) {
    return 1;
  }
  return 0;
}


const DealsPage = () => {
  const [filters, setFilters] = useState({ type: '', minDiscount: '', platform: '' });
  const { data: deals, isLoading, error } = useDeals(filters);

  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('discount');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedDeals = useMemo(() => {
    if (!deals) return [];
    return stableSort(deals, getComparator(order, orderBy));
  }, [deals, order, orderBy]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const Row = ({ index, style }) => {
    const deal = sortedDeals[index];
    // Render nothing if deal is not available (can happen during filter/sort changes)
    if (!deal) return null;
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

  const headCells = [
    { id: 'image', numeric: false, disablePadding: false, label: 'Image', sortable: false, width: '10%', align: 'center' },
    { id: 'title', numeric: false, disablePadding: false, label: 'Title', sortable: true, width: '35%' },
    { id: 'discount', numeric: true, disablePadding: false, label: 'Discount', sortable: true, width: '10%', align: 'left' },
    { id: 'mrp', numeric: true, disablePadding: false, label: 'MRP', sortable: true, width: '10%', align: 'left', paddingLeft: 1 },
    { id: 'price', numeric: true, disablePadding: false, label: 'Price', sortable: true, width: '10%', align: 'left', paddingLeft: 1 },
    { id: 'platform', numeric: false, disablePadding: false, label: 'Platform', sortable: true, width: '10%', align: 'center' },
    { id: 'link', numeric: false, disablePadding: false, label: 'Link', sortable: false, width: '10%', align: 'center' },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
        Latest Deals
      </Typography>

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

      {!isLoading && !error && (
        <Paper elevation={2} sx={{ borderRadius: '12px', overflow: 'hidden' }}>
          <TableContainer>
            <Table stickyHeader component="div" aria-label="deals table">
              <TableHead component="div">
                <TableRow component="div" sx={{ '& th': { backgroundColor: '#eef2f6', fontWeight: 'bold' }, display: 'flex' }}>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      sortDirection={orderBy === headCell.id ? order : false}
                      component="div"
                      sx={{
                        width: headCell.width,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: headCell.align === 'right' ? 'flex-end' : headCell.align === 'center' ? 'center' : 'flex-start',
                        paddingLeft: headCell.paddingLeft
                      }}
                    >
                      {headCell.sortable ? (
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : 'asc'}
                          onClick={(e) => handleRequestSort(e, headCell.id)}
                        >
                          {headCell.label}
                          {orderBy === headCell.id ? (
                            <Box component="span" sx={visuallyHidden}>
                              {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                            </Box>
                          ) : null}
                        </TableSortLabel>
                      ) : (
                        headCell.label
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody component="div">
                {sortedDeals.length > 0 ? (
                  <List
                    height={1000}
                    itemCount={sortedDeals.length}
                    itemSize={100}
                    width="100%"
                    // Pass sortedDeals to the list so it re-renders on sort change
                    itemData={sortedDeals}
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
