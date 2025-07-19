import React, { useState } from 'react';
import { useDeals } from '../hooks/useDeals';

const DealsPage = () => {
  const [filters, setFilters] = useState({ type: '', minDiscount: '', platform: '' });
  const { data: deals, isLoading, error } = useDeals(filters);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h1>Deals</h1>
      <div className="row mb-3">
        <div className="col">
          <input
            type="text"
            name="type"
            className="form-control"
            placeholder="Filter by type"
            value={filters.type}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col">
          <input
            type="number"
            name="minDiscount"
            className="form-control"
            placeholder="Min discount"
            value={filters.minDiscount}
            onChange={handleFilterChange}
          />
        </div>
        <div className="col">
          <select name="platform" className="form-select" value={filters.platform} onChange={handleFilterChange}>
            <option value="">All Platforms</option>
            <option value="flipkart">Flipkart</option>
            <option value="amazon">Amazon</option>
          </select>
        </div>
      </div>

      {isLoading && <p>Loading deals...</p>}
      {error && <p>Error fetching deals: {error.message}</p>}

      <div className="row">
        {deals && deals.map((deal) => (
          <div key={deal._id} className="col-md-4 mb-4">
            <div className="card">
              <img src={deal.image} className="card-img-top" alt={deal.name} />
              <div className="card-body">
                <h5 className="card-title">{deal.name}</h5>
                <p className="card-text">{deal.description}</p>
                <p className="card-text">Discount: {deal.discount}%</p>
                <p className="card-text">Price: {deal.price}</p>
                <a href={deal.link} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                  View Deal
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DealsPage;