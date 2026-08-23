import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { load } from './lib/storage.js';

// Set theme before paint to avoid a flash of the wrong mode.
const saved = load();
if (saved && saved.theme) document.documentElement.dataset.theme = saved.theme;

createRoot(document.getElementById('root')).render(<App />);
