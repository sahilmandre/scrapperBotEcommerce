import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';

const AnalyticsPage = () => {
  const { data: analytics, isLoading, error } = useAnalytics();

  console.log(analytics)

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Scraper Analytics</h1>

      {isLoading && <p>Loading analytics...</p>}
      {error && <p>Error fetching analytics: {error.message}</p>}

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">Total Deals</h2>
            <p className="text-2xl">{analytics.totalDeals}</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">Deals by Platform</h2>
            <ul>
              {Object.entries(analytics.dealsByPlatform).map(([platform, count]) => (
                <li key={platform}>{platform}: {count}</li>
              ))}
            </ul>
          </div>
          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">Average Discount</h2>
            <p className="text-2xl">Amazon - {analytics.avgDiscountByPlatform.amazon}%</p>
            <p className="text-2xl">Flipkart - {analytics.avgDiscountByPlatform.flipkart}%</p>
            <p className="text-2xl">JioMart - {analytics.avgDiscountByPlatform.jiomart}%</p>
          </div>

          <div className='p-4 border rounded-lg'>
            <h2>Top 5 Deals</h2>
            <ol>
              {analytics.topDiscounts.map((deal) => (
                <li key={deal.id}>
                  <a href={deal.link} target="_blank" rel="noopener noreferrer">
                    {deal.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-lg font-semibold">Deals By Type</h2>
              
              <ul>
                {Object.entries(analytics.dealsByType).map(([type, count]) => (
                  <li key={type}>
                    {type.toUpperCase()}: {count}
                  </li>
                ))}
              </ul>

          </div>

        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
