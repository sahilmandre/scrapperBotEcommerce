import React, { useState } from 'react';
import axios from 'axios';

const HomePage = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleScrape = async (platform) => {
    setLoading(true);
    setMessage('');
    try {
      const response = await axios.get(`http://localhost:3000/api/scrape/${platform}`);
      setMessage(response.data.message);
    } catch (error) {
      setMessage('Error scraping data');
    }
    setLoading(false);
  };

  return (
    <div>
      <h1>Welcome to Scrapper Bot</h1>
      <p>Use the buttons below to start scraping deals from different platforms.</p>
      <div className="d-grid gap-2 d-md-flex justify-content-md-start">
        <button className="btn btn-primary me-md-2" type="button" onClick={() => handleScrape('flipkart')} disabled={loading}>
          {loading ? 'Scraping...' : 'Scrape Flipkart'}
        </button>
        <button className="btn btn-primary" type="button" onClick={() => handleScrape('amazon')} disabled={loading}>
          {loading ? 'Scraping...' : 'Scrape Amazon'}
        </button>
        <button className="btn btn-primary" type="button" onClick={() => handleScrape('all')} disabled={loading}>
          {loading ? 'Scraping...' : 'Scrape All'}
        </button>
      </div>
      {message && <p className="mt-3">{message}</p>}
    </div>
  );
};

export default HomePage;