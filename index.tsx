import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Inject the API Key provided by the user for this session
// @ts-ignore
window.process = { 
  env: { 
    API_KEY: 'AIzaSyCEG2NQK_PLxs-wB5gwcp95A7DkAGWyb9E' 
  } 
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);