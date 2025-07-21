// import React, { useState, useEffect } from 'react';
// import { useSettings, useUpdateSettings } from '../hooks/useSettings';

// const SettingsPage = () => {
//   const { data: settings, isLoading, error } = useSettings();
//   const { mutate: updateSettings, isPending: isUpdating, isSuccess, isError } = useUpdateSettings();

//   const [discountThreshold, setDiscountThreshold] = useState('');

//   useEffect(() => {
//     if (settings) {
//       setDiscountThreshold(settings.DISCOUNT_THRESHOLD || '');
//     }
//   }, [settings]);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     updateSettings({ DISCOUNT_THRESHOLD: Number(discountThreshold) });
//   };

//   if (isLoading) {
//     return <p>Loading settings...</p>;
//   }

//   if (error) {
//     return <p>Error loading settings: {error.message}</p>;
//   }

//   return (
//     <div>
//       <h1>Settings</h1>
//       <form onSubmit={handleSubmit}>
//         <div className="mb-3">
//           <label htmlFor="discountThreshold" className="form-label">
//             Discount Threshold (%)
//           </label>
//           <input
//             type="number"
//             className="form-control"
//             id="discountThreshold"
//             value={discountThreshold}
//             onChange={(e) => setDiscountThreshold(e.target.value)}
//             placeholder="e.g., 50"
//           />
//         </div>
//         <button type="submit" className="btn btn-primary" disabled={isUpdating}>
//           {isUpdating ? 'Saving...' : 'Save Settings'}
//         </button>
//       </form>
//       {isSuccess && <div className="alert alert-success mt-3">Settings saved successfully!</div>}
//       {isError && <div className="alert alert-danger mt-3">Error saving settings.</div>}
//     </div>
//   );
// };

// export default SettingsPage;






// frontend/src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useDiscountThreshold, useUpdateDiscountThreshold } from '../hooks/useSettings';

const SettingsPage = () => {
  const [thresholdInput, setThresholdInput] = useState('');
  const [message, setMessage] = useState('');
  
  const { data: thresholdData, isLoading, error } = useDiscountThreshold();
  const updateThresholdMutation = useUpdateDiscountThreshold();

  // Set input value when data is loaded - now using DISCOUNT_THRESHOLD
  useEffect(() => {
    if (thresholdData && thresholdData.DISCOUNT_THRESHOLD !== undefined) {
      setThresholdInput(thresholdData.DISCOUNT_THRESHOLD.toString());
    }
  }, [thresholdData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const threshold = parseInt(thresholdInput);
    
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      setMessage('Please enter a valid threshold between 0 and 100');
      return;
    }

    try {
      const result = await updateThresholdMutation.mutateAsync(threshold);
      setMessage(result.message);
      setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
    } catch (error) {
      setMessage('Error updating threshold: ' + (error.response?.data?.error || error.message));
    }
  };

  if (isLoading) return <div>Loading settings...</div>;
  if (error) return <div>Error loading settings: {error.message}</div>;

  return (
    <div className="container mt-4">
      <h1>Scraper Settings</h1>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">Discount Threshold</h5>
            </div>
            <div className="card-body">
              <p className="card-text">
                Set the minimum discount percentage required for deals to be saved and displayed.
              </p>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="discountThreshold" className="form-label">
                    Current Threshold: {thresholdData?.DISCOUNT_THRESHOLD}%
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      className="form-control"
                      id="discountThreshold"
                      value={thresholdInput}
                      onChange={(e) => setThresholdInput(e.target.value)}
                      placeholder="Enter threshold (0-100)"
                      min="0"
                      max="100"
                      required
                    />
                    <span className="input-group-text">%</span>
                  </div>
                  <div className="form-text">
                    Only deals with discounts equal to or above this percentage will be saved.
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={updateThresholdMutation.isPending}
                >
                  {updateThresholdMutation.isPending ? 'Updating...' : 'Update Threshold'}
                </button>
              </form>
              
              {message && (
                <div className={`alert mt-3 ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title">How it Works</h5>
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li className="mb-2">
                  <strong>🎯 Threshold Control:</strong> Only products with discounts at or above your threshold will be scraped and saved.
                </li>
                <li className="mb-2">
                  <strong>💾 Database Storage:</strong> The threshold is stored in MongoDB, so it persists between scraping sessions.
                </li>
                <li className="mb-2">
                  <strong>⏱️ Real-time Updates:</strong> Changes apply immediately to the next scraping operation.
                </li>
                <li className="mb-2">
                  <strong>🔄 Auto-sync:</strong> Both scheduled and manual scraping will use the updated threshold.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;