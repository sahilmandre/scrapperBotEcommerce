
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchDeals = async ({ queryKey }) => {
  const [_key, { type, minDiscount, platform }] = queryKey;
  const { data } = await axios.get('http://localhost:3000/api/deals', {
    params: { type, minDiscount, platform },
  });
  return data;
};

export const useDeals = (filters) => {
  return useQuery({ queryKey: ['deals', filters], queryFn: fetchDeals });
};
