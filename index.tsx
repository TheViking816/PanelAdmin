import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const storedTheme = localStorage.getItem('theme');
if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else if (storedTheme === 'light') {
  document.documentElement.classList.remove('dark');
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
