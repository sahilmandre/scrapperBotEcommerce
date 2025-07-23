import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

// This function fetches the history for a single product.
const fetchProductHistory = async ({ queryKey }) => {
    const [_key, productId] = queryKey;
    // Don't run the fetch if there's no productId
    if (!productId) return null;
    
    const { data } = await axios.get(`http://localhost:3000/api/products/${productId}/history`);
    return data;
};

/**
 * A custom hook to fetch the price history of a specific product.
 * @param {string} productId - The unique ID of the product to fetch.
 * @returns The react-query object for the product history query.
 */
export const useProductHistory = (productId) => {
    return useQuery({
        queryKey: ['productHistory', productId],
        queryFn: fetchProductHistory,
        // This query will only run when a `productId` is provided.
        enabled: !!productId, 
        staleTime: 1000 * 60 * 5, // Cache the data for 5 minutes to avoid refetching on modal re-open.
        refetchOnWindowFocus: false, // Optional: prevents refetching when window is focused.
    });
};
