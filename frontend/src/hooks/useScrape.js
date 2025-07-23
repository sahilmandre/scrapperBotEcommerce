import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// The function that performs the API call
const scrapePlatform = async (platform) => {
    const { data } = await axios.get(`http://localhost:3000/api/scrape/${platform}`);
    return data;
};

// The custom hook that uses the mutation
export const useScrape = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: scrapePlatform,
        // When the scrape is successful, we should invalidate deals and analytics
        // so they refetch with the new data on their respective pages.
        onSuccess: () => {
            console.log("Scraping successful. Invalidating deals and analytics queries.");
            queryClient.invalidateQueries({ queryKey: ['deals'] });
            queryClient.invalidateQueries({ queryKey: ['analytics'] });
        },
        onError: (error) => {
            console.error("Scraping failed:", error);
        }
    });
};
