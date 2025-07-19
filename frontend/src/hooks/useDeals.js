import { useQuery } from "@tanstack/react-query";
import axios from "axios";

export const useDeals = (type, minDiscount) => {
  const params = new URLSearchParams();
  if (type) params.append("type", type);
  if (minDiscount) params.append("minDiscount", minDiscount);

  const url = `/api/deals?${params.toString()}`;

  const query = useQuery({
    queryKey: ["deals", type, minDiscount],
    queryFn: async () => {
      const { data } = await axios.get(url);
      return data;
    },
  });

  return query;
};
