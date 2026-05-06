import { useState, useEffect } from 'react';
import Layout from './layout/Layout';
import Downloader from './components/Downloader';
import Contact from './components/Contact';

function App() {
  const [resetKey, setResetKey] = useState(0);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleReset = () => {
    setResetKey(prev => prev + 1);
  };

  return (
    <Layout onReset={handleReset} theme={theme} onToggleTheme={toggleTheme}>
      <Downloader key={resetKey} />
      <Contact />
    </Layout>
  );
}

export default App;
