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

      <div className="table-responsive">
        <table className="table table-striped table-bordered">
          <thead className="sticky-header">
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Discount</th>
              <th>MRP</th>
              <th>Price</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {deals && deals.map((deal) => (
              <tr key={deal._id}>
                <td><img src={deal.image} alt={deal.title.slice(0, 15)} style={{ maxWidth: '100px' }} /></td>
                <td>{deal.title}</td>
                <td>{deal.discount}%</td>
                <td>{deal.mrp}</td>
                <td>{deal.price}</td>
                <td>
                  <a href={deal.link} className="btn btn-primary" target="_blank" rel="noopener noreferrer">
                    View Deal
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsPage;