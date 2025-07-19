import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchAnalytics = async () => {
  const { data } = await axios.get('http://localhost:3000/api/analytics');
  return data;
};

export const useAnalytics = () => {
  return useQuery({ queryKey: ['analytics'], queryFn: fetchAnalytics });
};
