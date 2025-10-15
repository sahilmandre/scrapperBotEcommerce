// frontend/src/pages/FoodDealsPage.jsx
import React from 'react';
import { useFoodDeals } from '../hooks/useFoodDeals';
import {
  Container,
  Typography,
  CircularProgress,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip
} from '@mui/material';

const FoodDealsPage = () => {
  const { data: deals, isLoading, error } = useFoodDeals();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center" sx={{ my: 5 }}>
          Error fetching food deals: {error.message}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold' }}>
        Food & Restaurant Deals
      </Typography>
      
      {deals && deals.length > 0 ? (
        <Grid container spacing={4}>
          {deals.map((deal) => (
            <Grid item key={deal._id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardMedia
                  component="img"
                  height="160"
                  image={deal.image || 'https://placehold.co/300x160/eee/ccc?text=No+Image'}
                  alt={deal.dishName}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h6" component="div">
                    {deal.dishName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {deal.restaurantName}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                        {deal.price}
                    </Typography>
                    {deal.discount && <Chip label={deal.discount} color="success" size="small" />}
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, pt: 0 }}>
                    <Button 
                        variant="contained" 
                        fullWidth 
                        href={deal.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                    >
                        View Deal
                    </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography align="center" sx={{ my: 5 }} color="text.secondary">
          No food deals have been scraped yet. Try running a food scraper from the Home page.
        </Typography>
      )}
    </Container>
  );
};

export default FoodDealsPage;
