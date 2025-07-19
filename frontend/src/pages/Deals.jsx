import { useDeals } from "../hooks/useDeals";
import DealCard from "../components/DealCard";
import FilterBar from "../components/FilterBar";
import Loader from "../components/Loader";
import { useState } from "react";

export default function Deals() {
  const [type, setType] = useState("");
  const [minDiscount, setMinDiscount] = useState(80);

  const { data, isLoading, error } = useDeals(type, minDiscount);

  if (isLoading) return <Loader />;
  if (error) return <div className="text-red-500">Error loading deals.</div>;

  console.log("✅ useDeals response:", data);

  const deals = Array.isArray(data) ? data : [];

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">🔥 Latest Deals</h1>
      <FilterBar
        type={type}
        setType={setType}
        minDiscount={minDiscount}
        setMinDiscount={setMinDiscount}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
        {deals.length === 0 ? (
          <p>No deals found. Try changing filters.</p>
        ) : (
          deals.map((deal) => <DealCard key={deal._id} deal={deal} />)
        )}
      </div>
    </div>
  );
}
