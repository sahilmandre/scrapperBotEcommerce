# Frontend Folder Structure

This document outlines the folder structure of the frontend part of the project.

```
frontend/
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── README.md
├── vite.config.js
├── public/
│   └── vite.svg
└── src/
    ├── App.css
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── api/
    │   ├── analytics.js
    │   └── deals.js
    ├── assets/
    │   └── react.svg
    ├── components/
    │   ├── DealCard.jsx
    │   ├── FilterBar.jsx
    │   └── Loader.jsx
    ├── hooks/
    │   └── useDeals.js
    ├── pages/
    │   ├── Deals.jsx
    │   ├── Home.jsx
    │   └── NotFound.jsx
    ├── routes/
    │   └── AppRouter.jsx
    └── utils/
        └── formatPrice.js
```

## Description

- `public/`: Contains static assets served directly.
- `src/`: Main source code directory.
  - `api/`: API interaction modules.
  - `assets/`: Static assets like images.
  - `components/`: Reusable React components.
  - `hooks/`: Custom React hooks.
  - `pages/`: React components representing pages.
  - `routes/`: Application routing components.
  - `utils/`: Utility functions.
