import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { preloadCardArt } from './assets/cards/index.js';
import './styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing #root element');
}

preloadCardArt();

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
