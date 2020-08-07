import React from 'react';

import User from './container/User/index.jsx';
import Chat from './container/Chat/index.jsx';

export default function App() {
  return (
    <div className="wrap">
      <Chat />
      <User />
    </div>
  );
}
