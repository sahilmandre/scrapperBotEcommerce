// // frontend/src/hooks/useSettings.js
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';

// const API_BASE = 'http://localhost:3000/api/settings';

// // Fetch all settings
// const fetchSettings = async () => {
//   const { data } = await axios.get(API_BASE);
//   return data;
// };

// // Update setting
// const updateSetting = async ({ key, value }) => {
//   const { data } = await axios.put(`${API_BASE}/${key}`, { value });
//   return data;
// };

// // Update multiple settings
// const updateSettings = async (settings) => {
//   const { data } = await axios.put(API_BASE, settings);
//   return data;
// };

// // Hook to get all settings
// export const useSettings = () => {
//   return useQuery({
//     queryKey: ['settings'],
//     queryFn: fetchSettings,
//   });
// };

// // Hook to update single setting
// export const useUpdateSetting = () => {
//   const queryClient = useQueryClient();
  
//   return useMutation({
//     mutationFn: updateSetting,
//     onSuccess: () => {
//       // Invalidate and refetch settings
//       queryClient.invalidateQueries({ queryKey: ['settings'] });
//     },
//   });
// };

// // Hook to update multiple settings
// export const useUpdateSettings = () => {
//   const queryClient = useQueryClient();
  
//   return useMutation({
//     mutationFn: updateSettings,
//     onSuccess: () => {
//       // Invalidate and refetch settings
//       queryClient.invalidateQueries({ queryKey: ['settings'] });
//     },
//   });
// };


// frontend/src/hooks/useSettings.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const fetchDiscountThreshold = async () => {
  const { data } = await axios.get('http://localhost:3000/api/settings/DISCOUNT_THRESHOLD');
  return data;
};

const updateDiscountThreshold = async (threshold) => {
  const { data } = await axios.put('http://localhost:3000/api/settings/DISCOUNT_THRESHOLD', {
    value: parseInt(threshold)  // Changed from 'threshold' to 'value'
  });
  return data;
};

export const useDiscountThreshold = () => {
  return useQuery({ 
    queryKey: ['discountThreshold'], 
    queryFn: fetchDiscountThreshold 
  });
};

export const useUpdateDiscountThreshold = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateDiscountThreshold,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['discountThreshold'] });
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
};