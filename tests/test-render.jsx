import React from 'react';
import { renderToString } from 'react-dom/server';
import { MediaRepositoryPage } from '../src/media/MediaRepositoryPage.jsx';

try {
  // Mock currentUser
  const currentUser = {
    role: { name: 'admin' },
    permissions: ['*']
  };

  const html = renderToString(<MediaRepositoryPage currentUser={currentUser} />);
  console.log("RENDER SUCCESS!");
} catch (error) {
  console.error("RENDER ERROR:");
  console.error(error.message);
  console.error(error.stack);
}
