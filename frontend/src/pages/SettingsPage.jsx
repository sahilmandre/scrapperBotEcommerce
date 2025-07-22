import React, { useState, useEffect } from 'react';
// ✅ Import the new, more flexible hooks
import { useAllSettings, useUpdateAllSettings } from '../hooks/useSettings';

const SettingsPage = () => {
  // State to hold the form inputs for all settings
  const [formState, setFormState] = useState({
    DISCOUNT_THRESHOLD: '',
    PRODUCT_TYPES: '', // We'll store the array as a newline-separated string for the textarea
  });
  const [message, setMessage] = useState('');

  // ✅ Fetch all settings using the new hook
  const { data: settingsData, isLoading, error } = useAllSettings();
  // ✅ Get the mutation function for updating all settings
  const updateSettingsMutation = useUpdateAllSettings();

  // Effect to populate the form once settings data is loaded from the API
  useEffect(() => {
    if (settingsData) {
      setFormState({
        DISCOUNT_THRESHOLD: settingsData.DISCOUNT_THRESHOLD?.toString() || '',
        // Convert the array of types into a single string, with each type on a new line
        PRODUCT_TYPES: settingsData.PRODUCT_TYPES?.join('\n') || '',
      });
    }
  }, [settingsData]);

  // Handle changes for any input field
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission to save all settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // --- Data Preparation and Validation ---
    const threshold = parseInt(formState.DISCOUNT_THRESHOLD);
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      setMessage('Error: Discount threshold must be a number between 0 and 100.');
      return;
    }

    // Convert the newline-separated string back into an array of strings
    // 1. Split the string by new lines
    // 2. Trim whitespace from each line
    // 3. Filter out any empty lines that might result from extra spaces
    const productTypesArray = formState.PRODUCT_TYPES.split('\n')
      .map(type => type.trim())
      .filter(type => type);

    if (productTypesArray.length === 0) {
      setMessage('Error: You must provide at least one product type.');
      return;
    }

    // Construct the payload to send to the API
    const settingsToUpdate = {
      ...settingsData, // Start with existing settings to not lose any
      DISCOUNT_THRESHOLD: threshold,
      PRODUCT_TYPES: productTypesArray,
    };

    try {
      const result = await updateSettingsMutation.mutateAsync(settingsToUpdate);
      setMessage('✅ Settings updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('❌ Error updating settings: ' + (error.response?.data?.error || error.message));
    }
  };

  if (isLoading) return <div className="text-center mt-5">Loading settings...</div>;
  if (error) return <div className="alert alert-danger mt-5">Error loading settings: {error.message}</div>;

  return (
    <div className="container mt-4">
      <h1>Scraper Settings</h1>
      <p>Configure the scraper's behavior. Changes apply to the next scraping cycle.</p>

      <form onSubmit={handleSubmit} className="mt-4">
        <div className="row g-4">

          {/* --- Discount Threshold Card --- */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">Discount Threshold (%)</h5>
              </div>
              <div className="card-body">
                <p className="card-text">
                  Set the minimum discount percentage for deals to be saved.
                </p>
                <div className="input-group">
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
          </div>

          {/* --- Product Types Card (NEW) --- */}
          <div className="col-md-6">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="card-title mb-0">Product Types to Scrape</h5>
              </div>
              <div className="card-body">
                <p className="card-text">
                  Enter each product type on a new line. These will be used to search on all platforms.
                </p>
                <textarea
                  className="form-control"
                  id="PRODUCT_TYPES"
                  name="PRODUCT_TYPES"
                  value={formState.PRODUCT_TYPES}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="laptops&#10;mobiles&#10;saree&#10;t-shirts"
                  required
                ></textarea>
              </div>
            </div>
          </div>

        </div>

        {/* --- Submit Button and Message Area --- */}
        <div className="mt-4">
          <button
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>

        {message && (
          <div className={`alert mt-3 ${message.includes('Error') ? 'alert-danger' : 'alert-success'}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default SettingsPage;
