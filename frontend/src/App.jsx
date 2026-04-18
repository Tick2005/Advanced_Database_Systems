import React from 'react';
import { useRoutes } from 'react-router-dom';
import appRoutes from './routes';

const App = () => {
  const element = useRoutes(appRoutes);
  return <div className="app-shell">{element}</div>;
};
export default App;
