import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  const LINKS = {
    [t('Product') || 'Product']: ['Features', 'Supported sites', 'API access', 'Changelog'],
    [t('Developers') || 'Developers']: ['API docs', 'Rate limits', 'GitHub', 'Status'],
    [t('Company') || 'Company']: ['About', 'Privacy policy', 'Terms of service', 'Contact'],
  };

  return (
    <footer className="mt-auto border-t border-[var(--border-tertiary)] bg-[var(--surface-primary)] pt-24 pb-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          
          {/* Brand Column */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-[var(--text-primary)] tracking-tight">{t('header.title')}</span>
            </div>
            <p className="text-lg text-[var(--text-secondary)] max-w-sm mb-8 leading-relaxed">
              {t('footer.desc')}
            </p>
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white text-emerald-600 text-[10px] font-bold uppercase tracking-widest border border-white shadow-sm">              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('footer.badge')}
            </div>
          </div>

          {/* Links Columns */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12">
            {Object.entries(LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h4 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-6">{heading}</h4>
                <ul className="space-y-4">
                  {links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm font-medium text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-[var(--border-tertiary)] flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-sm text-[var(--text-tertiary)] font-medium">
            © {new Date().getFullYear()} {t('header.title')}. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-8">
            {['Privacy', 'Terms', 'Cookies'].map(l => (
              <a key={l} href="#" className="text-xs font-bold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] uppercase tracking-widest transition-colors">
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
