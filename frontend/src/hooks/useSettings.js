import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// --- API Functions ---

// 1. Fetches the entire settings object
const fetchAllSettings = async () => {
  const { data } = await axios.get("http://localhost:3000/api/settings");
  return data;
};

// 2. Updates the entire settings object
const updateAllSettings = async (settings) => {
  // The backend expects a PUT request to the base /api/settings endpoint
  const { data } = await axios.put(
    "http://localhost:3000/api/settings",
    settings
  );
  return data;
};

// --- React Query Hooks ---

// 1. Hook to get all settings
export const useAllSettings = () => {
  return useQuery({
    queryKey: ["settings"], // A single query key for all settings
    queryFn: fetchAllSettings,
  });
};

// 2. Hook to update all settings
export const useUpdateAllSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAllSettings,
    onSuccess: () => {
      // When the mutation is successful, invalidate the 'settings' query to refetch the latest data.
      // This will automatically update the UI everywhere the settings are used.
      console.log("Settings updated successfully, invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ["settings"] });

      // We can also invalidate other queries that might depend on these settings
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      console.error("Error updating settings:", error);
    },
  });
};
