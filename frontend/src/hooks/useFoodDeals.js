// frontend/src/hooks/useFoodDeals.js
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const fetchFoodDeals = async () => {
  const { data } = await axios.get("http://localhost:3000/api/foodDeals");
  return data;
};

export const useFoodDeals = () => {
  return useQuery({
    queryKey: ["foodDeals"],
    queryFn: fetchFoodDeals,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
