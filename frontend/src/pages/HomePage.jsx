import React from 'react';
import { useScrape } from '../hooks/useScrape'; // ✅ Import the new custom hook

const ScrapeButton = ({ platform, onScrape, loading }) => {
  const platformColors = {
    flipkart: 'btn-primary',
    amazon: 'btn-warning text-dark',
    jiomart: 'btn-danger',
    // ✅ New Platform Style
    zepto: 'btn-info',
    all: 'btn-success'
  };
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  return (
    <button
      className={`btn ${platformColors[platform]} me-2 mb-2`}
      type="button"
      onClick={() => onScrape(platform)}
      disabled={loading}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
          Scraping...
        </>
      ) : `Scrape ${platformName}`}
    </button>
  );
};


const HomePage = () => {
  // ✅ Use the new hook for scraping. It provides all the state we need.
  const scrapeMutation = useScrape();

  const handleScrape = (platform) => {
    // The mutate function from the hook triggers the API call
    scrapeMutation.mutate(platform);
  };

  const renderResults = () => {
    // Use the state provided by the useMutation hook
    if (scrapeMutation.isIdle) return null; // Don't show anything initially
    if (scrapeMutation.isError) {
      const errorMessage = scrapeMutation.error.response?.data?.error || 'Error scraping data';
      return <div className="alert alert-danger mt-4">{errorMessage}</div>;
    }
    if (scrapeMutation.isSuccess) {
      const scrapeResult = scrapeMutation.data;

      // Check if we have the detailed results from 'scrape all'
      if (scrapeResult.results) {
        return (
          <div className="card mt-4">
            <div className="card-header fw-bold">
              {scrapeResult.message} (Total: {scrapeResult.total} deals)
            </div>
            <ul className="list-group list-group-flush">
              {Object.entries(scrapeResult.results).map(([platform, count]) => (
                <li key={platform} className="list-group-item d-flex justify-content-between align-items-center">
                  {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  <span className="badge bg-primary rounded-pill">{count} deals found</span>
                </li>
              ))}
            </ul>
          </div>
        );
      }

          // Fallback for single scrape messages
          if (scrapeResult.message) {
            return <div className="alert alert-success mt-4">{scrapeResult.message}</div>;
          }
      }

      return null;
    };

  return (
      <div className="container py-5">
        <div className="text-center">
          <h1 className="display-4 fw-bold">Welcome to Scrapper Bot</h1>
          <p className="lead text-muted mt-3">
            Use the buttons below to start scraping deals from different platforms.
          </p>
        </div>

        <div className="card shadow-sm mt-5">
          <div className="card-body p-4">
            <h5 className="card-title mb-3">Manual Scraping</h5>
            <div className="d-flex flex-wrap justify-content-start">
              <ScrapeButton platform="flipkart" onScrape={handleScrape} loading={scrapeMutation.isPending} />
              <ScrapeButton platform="amazon" onScrape={handleScrape} loading={scrapeMutation.isPending} />
              <ScrapeButton platform="jiomart" onScrape={handleScrape} loading={scrapeMutation.isPending} />

            <ScrapeButton platform="zepto" onScrape={handleScrape} loading={scrapeMutation.isPending} />
              <ScrapeButton platform="all" onScrape={handleScrape} loading={scrapeMutation.isPending} />
            </div>
          </div>
        </div>

        <div className="mt-4">
          {/* Show a loading indicator while scraping */}
          {scrapeMutation.isPending && (
            <div className="d-flex justify-content-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          {renderResults()}
        </div>
      </div>
    );
};

export default HomePage;
