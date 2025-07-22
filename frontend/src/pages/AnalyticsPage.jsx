import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import './AnalyticsPage.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const AnalyticsPage = () => {
  const { data: analytics, isLoading, error } = useAnalytics();

  if (isLoading) return <p>Loading analytics...</p>;
  if (error) return <p>Error fetching analytics: {error.message}</p>;

  const dealsByPlatformData = {
    labels: Object.keys(analytics.dealsByPlatform),
    datasets: [
      {
        label: 'Deals by Platform',
        data: Object.values(analytics.dealsByPlatform),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  const dealsByTypeData = {
    labels: Object.keys(analytics.dealsByType),
    datasets: [
      {
        label: 'Deals by Type',
        data: Object.values(analytics.dealsByType),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };

  return (
    <div className="container-fluid analytics-page">
      <h1 className="text-center my-4">Scraper Analytics</h1>

      <div className="bento-grid">
        <div className="bento-item bento-item-1 card text-center p-3">
          <div className="card-body">
            <h5 className="card-title">Total Deals</h5>
            <p className="card-text display-4">{analytics.totalDeals}</p>
          </div>
        </div>
        <div className="bento-item bento-item-2 card text-center p-3">
          <div className="card-body">
            <h5 className="card-title">Average Discount</h5>
            <p className="card-text">Amazon: {analytics.avgDiscountByPlatform.amazon}%</p>
            <p className="card-text">Flipkart: {analytics.avgDiscountByPlatform.flipkart}%</p>
            <p className="card-text">JioMart: {analytics.avgDiscountByPlatform.jiomart}%</p>
          </div>
        </div>
        <div className="bento-item bento-item-3 card p-3">
          <div className="card-body">
            <h5 className="card-title text-center">Deals by Platform</h5>
            <div className="chart-container">
              <Doughnut data={dealsByPlatformData} />
            </div>
          </div>
        </div>
        <div className="bento-item bento-item-4 card p-3">
          <div className="card-body">
            <h5 className="card-title text-center">Deals by Type</h5>
            <div className="chart-container">
              <Bar data={dealsByTypeData} />
            </div>
          </div>
        </div>
        <div className="bento-item bento-item-5 card p-3">
          <div className="card-body">
            <h5 className="card-title text-center">Top 5 Deals</h5>
            <ol className="list-group list-group-flush">
              {analytics.topDiscounts.map((deal) => (
                <li className="list-group-item" key={deal._id}>
                  <a href={deal.link} target="_blank" rel="noopener noreferrer">
                    {deal.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;

