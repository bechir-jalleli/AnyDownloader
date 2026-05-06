import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, onReset, theme, onToggleTheme }) {
  return (
    <div className="app-root">
      <Header onReset={onReset} theme={theme} onToggleTheme={onToggleTheme} />
      <main className="main">
        {children}
      </main>
      <Footer />
    </div>
  );
}
