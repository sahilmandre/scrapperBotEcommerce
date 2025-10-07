Implementation Plan: Pincode-Based Search
This document outlines the step-by-step plan to implement a pincode-based search feature in the web scraping application. This will allow the scrapers to fetch only products available at a user-specified pincode.

Phase 1: Backend Foundation
Objective: To create a persistent storage for the pincode that the scrapers can access.

Update the Settings Schema:

File: backend/models/settings.js

Action: Add a new pincode field of type String to the settingsSchema. This will allow us to store the pincode in the MongoDB database.

Update the Settings API:

File: backend/routes/settings.js

Action: Modify the POST endpoint to accept and update the new pincode value in the database.

Pass Pincode to Scrapers:

Files: backend/server.js (for scheduled scrapes) and backend/routes/scrape.js (for manual scrapes).

Action: In both files, before triggering a scraper, fetch the latest settings (including the pincode) from the database. Then, pass the pincode as an argument to the respective scraper function (e.g., scrapeAmazon(urls, pincode)).

Phase 2: Frontend Integration
Objective: To allow the pincode to be easily viewed and changed from the web interface.

Create Pincode Input Field:

File: frontend/src/pages/SettingsPage.jsx

Action: Add a new labeled input field on the Settings page for entering the pincode.

Connect UI to the API:

File: frontend/src/hooks/useSettings.js

Action: Update the updateSettings mutation logic to include the pincode in the payload sent to the backend.

File: frontend/src/pages/SettingsPage.jsx

Action:

Fetch the current settings and display the saved pincode in the input field.

Manage the state of the input field.

On "Save," call the updateSettings mutation with the new pincode.

Phase 3: Scraper Intelligence
Objective: To make each scraper use the provided pincode to get location-specific results.

Amazon Scraper (backend/scrapers/amazon.js):

Investigation: Determine the sequence of Puppeteer actions required to set the delivery pincode on Amazon's website.

Implementation:

Launch Puppeteer and navigate to Amazon.

Automate clicks to open the "Deliver to" location widget.

Enter the pincode into the relevant input field and submit.

Wait for the page to reload with the new location.

Proceed with the existing product scraping logic.

Flipkart Scraper (backend/scrapers/flipkart.js):

Investigation: Find the specific selectors and user interactions for setting a pincode on Flipkart.

Implementation: Update the Puppeteer script to automatically find and fill in the pincode on Flipkart before it starts scraping.

JioMart Scraper (backend/scrapers/jiomart.js):

Investigation: Check if the Algolia API (currently in use) accepts a pincode or location parameter.

Implementation:

If API supports pincode: Add the pincode as a parameter to the API request. This is the preferred, most efficient method.

If API does not support pincode: Refactor the scraper to use Puppeteer, similar to the Amazon and Flipkart scrapers, to set the location on the JioMart website first.

This structured plan ensures that we build the feature methodically, from the database layer up to the user interface and scraper logic. We will proceed with these phases in order.