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
            <option value="jiomart">JioMart</option>
          </select>
        </div>
      </div>

      {isLoading && <p>Loading deals...</p>}
      {error && <p>Error fetching deals: {error.message}</p>}

      <div>
        <table className="table table-striped table-bordered w-100" style={{ tableLayout: 'fixed' }}>
          <thead className="sticky-header">
            <tr className='text-left'>
              <th className='col-2'>Image</th>
              <th className='col-4 text-truncate'>Title</th>
              <th className='col-2'>Discount</th>
              <th className='col-2'>MRP</th>
              <th className='col-1'>Price</th>
              <th className='col-2'>Link</th>
            </tr>
          </thead>
          <tbody>
            {deals && deals.map((deal) => (
              <tr key={deal._id}>
                <td className='text-center'><img src={deal.image} alt={deal.title.slice(0, 15)} className='image' /></td>
                <td style={{ wordBreak: 'break-word' }} className='text-ellipsis'>{deal.title}</td>
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