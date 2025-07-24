import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchDeals = async ({ queryKey }) => {
  // ✅ Destructure the new filter shape
  const [_key, { searchQuery, selectedType, minDiscount, platform }] = queryKey;

  const { data } = await axios.get("http://localhost:3000/api/deals", {
    // ✅ Pass the new parameters to the API
    params: { searchQuery, selectedType, minDiscount, platform },
  });
  return data;
};

export const useDeals = (filters) => {
  return useQuery({
    queryKey: ["deals", filters],
    queryFn: fetchDeals,
    // Add a stale time to prevent rapid-fire refetching while user types
    staleTime: 500,
  });
};
