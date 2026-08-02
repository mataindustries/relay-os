import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { App } from './app/App';
import './app/styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('RelayOS requires an element with the id "root".');
}

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
