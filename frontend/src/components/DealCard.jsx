import { formatPrice } from "../utils/formatPrice";

export default function DealCard({ deal }) {
  return (
    <a
      href={deal.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-2xl shadow hover:shadow-lg transition p-4"
    >
      <h2 className="font-semibold text-lg mb-1">{deal.title}</h2>
      <p>
        <span className="text-green-600 font-bold">{formatPrice(deal.price)}</span>{" "}
        <span className="line-through text-sm text-gray-500">
          {formatPrice(deal.mrp)}
        </span>
      </p>
      <p className="text-sm text-gray-600 mt-1">
        {deal.platform} | {deal.type}
      </p>
      <p className="text-sm mt-1 font-bold text-blue-500">
        {deal.discount}% OFF
      </p>
    </a>
  );
}
