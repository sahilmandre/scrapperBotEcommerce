// frontend/src/pages/SettingsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAllSettings, useUpdateAllSettings } from '../hooks/useSettings';

// --- SVG Icons ---
const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} className="text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ListIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} className="text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
  </svg>
);

const PincodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} className="text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

// ✅ NEW: Icon for coordinates
const GeoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '1.5rem', width: '1.5rem' }} className="text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


const SettingsPage = () => {
  const [formState, setFormState] = useState({
    DISCOUNT_THRESHOLD: '', PRODUCT_TYPES: '', PINCODE: '',
    ZEPTO_LATITUDE: '', // Add state for Zepto lat
    ZEPTO_LONGITUDE: '', // Add state for Zepto long
  });
  const [message, setMessage] = useState('');

  const { data: settingsData, isLoading, error } = useAllSettings();
  const updateSettingsMutation = useUpdateAllSettings();

  useEffect(() => {
    if (settingsData) {
      setFormState({
        DISCOUNT_THRESHOLD: settingsData.DISCOUNT_THRESHOLD?.toString() || '',
        PRODUCT_TYPES: settingsData.PRODUCT_TYPES?.join('\n') || '',
        PINCODE: settingsData.PINCODE || '',
        ZEPTO_LATITUDE: settingsData.ZEPTO_LATITUDE?.toString() || '', // Populate state
        ZEPTO_LONGITUDE: settingsData.ZEPTO_LONGITUDE?.toString() || '', // Populate state

      });
    }
  }, [settingsData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({ ...prevState, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const threshold = parseInt(formState.DISCOUNT_THRESHOLD);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      setMessage('Error: Discount threshold must be a number between 0 and 100.');
      return;
    }

    const productTypesArray = formState.PRODUCT_TYPES.split('\n').map(type => type.trim()).filter(Boolean);
    if (productTypesArray.length === 0) {
      setMessage('Error: You must provide at least one product type.');
      return;
    }

    if (!/^\d{6}$/.test(formState.PINCODE)) {
      setMessage('Error: Pincode must be a 6-digit number.');
      return;
    }

    // ✅ NEW: Validate coordinates
    const lat = parseFloat(formState.ZEPTO_LATITUDE);
    const lon = parseFloat(formState.ZEPTO_LONGITUDE);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      setMessage('Error: Latitude must be a valid number between -90 and 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setMessage('Error: Longitude must be a valid number between -180 and 180.');
      return;
    }

    const settingsToUpdate = {
      ...settingsData,
      DISCOUNT_THRESHOLD: threshold,
      PRODUCT_TYPES: productTypesArray,
      PINCODE: formState.PINCODE,
      ZEPTO_LATITUDE: lat, // Add to payload
      ZEPTO_LONGITUDE: lon, // Add to payload
    };

    try {
      await updateSettingsMutation.mutateAsync(settingsToUpdate);
      setMessage('Success: Settings updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setMessage('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  if (isLoading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="container mt-5">
      <div className="alert alert-danger" role="alert">
        <h4 className="alert-heading">Error Loading Data!</h4>
        <p>{error.message}</p>
      </div>
    </div>
  );

  return (
    <div className="container py-5">
      <header className="mb-5 text-center">
        <h1 className="display-5 fw-bold">Scraper Settings</h1>
        <p className="lead text-muted">
          Fine-tune the scraper's parameters. Your changes will be applied on the next run.
        </p>
      </header>

      <div className="row justify-content-center">
        <div className="col-lg-10">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* --- Discount Threshold and Pincode Row --- */}
              <div className="col-lg-6">
                <div className="d-flex flex-column h-100">
                  <div className="card shadow-sm mb-4">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center mb-2">
                        <SettingsIcon />
                        <h5 className="mb-0 ms-2">Discount Threshold</h5>
                      </div>
                      <p className="text-muted small">
                        Minimum discount % for a deal to be saved.
                      </p>
                      <div className="input-group mt-3">
                        <input
                          type="number"
                          className="form-control"
                          id="DISCOUNT_THRESHOLD"
                          name="DISCOUNT_THRESHOLD"
                          value={formState.DISCOUNT_THRESHOLD}
                          onChange={handleInputChange}
                          placeholder="e.g., 80"
                          min="0"
                          max="100"
                          required
                        />
                        <span className="input-group-text">%</span>
                      </div>
                    </div>
                  </div>
                  <div className="card shadow-sm flex-grow-1">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center mb-2">
                        <PincodeIcon />
                        <h5 className="mb-0 ms-2">Delivery Pincode</h5>
                      </div>
                      <p className="text-muted small">
                        Scrape products available at this pincode.
                      </p>
                      <div className="input-group mt-3">
                        <input
                          type="text"
                          className="form-control"
                          id="PINCODE"
                          name="PINCODE"
                          value={formState.PINCODE}
                          onChange={handleInputChange}
                          placeholder="e.g., 452001"
                          maxLength="6"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* ✅ NEW: Zepto Coordinates Card */}
                  <div className="card shadow-sm mt-4">
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center mb-2">
                        <GeoIcon />
                        <h5 className="mb-0 ms-2">Zepto Geolocation</h5>
                      </div>
                      <p className="text-muted small">
                        Latitude & Longitude for Zepto scraper.
                      </p>
                      <div className="row gx-2 mt-3">
                        <div className="col">
                          <input
                            type="number"
                            className="form-control"
                            id="ZEPTO_LATITUDE"
                            name="ZEPTO_LATITUDE"
                            value={formState.ZEPTO_LATITUDE}
                            onChange={handleInputChange}
                            placeholder="e.g., 22.7196"
                            step="any"
                            required
                          />
                        </div>
                        <div className="col">
                          <input
                            type="number"
                            className="form-control"
                            id="ZEPTO_LONGITUDE"
                            name="ZEPTO_LONGITUDE"
                            value={formState.ZEPTO_LONGITUDE}
                            onChange={handleInputChange}
                            placeholder="e.g., 75.8577"
                            step="any"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>


              {/* --- Product Types Card --- */}
              <div className="col-lg-6">
                <div className="card shadow-sm h-100">
                  <div className="card-body p-4 d-flex flex-column">
                    <div className="d-flex align-items-center mb-2">
                      <ListIcon />
                      <h5 className="mb-0 ms-2">Product Types to Scrape</h5>
                    </div>
                    <p className="text-muted small">
                      Enter each product category on a new line.
                    </p>
                    <div className="mt-3 flex-grow-1">
                      <textarea
                        className="form-control"
                        id="PRODUCT_TYPES"
                        name="PRODUCT_TYPES"
                        value={formState.PRODUCT_TYPES}
                        onChange={handleInputChange}
                        placeholder="laptops&#10;mobiles&#10;saree&#10;t-shirts"
                        rows="12"
                        required
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- Form Footer: Button and Message --- */}
            <div className="mt-4 d-flex justify-content-end align-items-center p-3">
              {message && (
                <div className={`fw-bold small me-4 ${message.includes('Error') ? 'text-danger' : 'text-success'}`}>
                  {message.split(': ')[1]}
                </div>
              )}
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
