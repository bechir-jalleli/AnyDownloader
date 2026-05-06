import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function Contact() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const email = 'bechirjalleli@gmail.com';

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SOCIALS = [
    {
      name: 'Instagram',
      username: '@bechirjalleli',
      url: 'https://instagram.com/bechirjalleli',
      icon: (
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01" />
        </svg>
      ),
      color: 'group-hover:text-[#E1306C]',
      bg: 'group-hover:bg-[#E1306C]/5',
    },
    {
      name: 'LinkedIn',
      username: 'bechirjalleli',
      url: 'https://linkedin.com/in/bechirjalleli',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z" />
        </svg>
      ),
      color: 'group-hover:text-[#0A66C2]',
      bg: 'group-hover:bg-[#0A66C2]/5',
    },
    {
      name: 'GitHub',
      username: 'bechirjalleli',
      url: 'https://github.com/bechirjalleli',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
        </svg>
      ),
      color: 'group-hover:text-[var(--text-primary)]',
      bg: 'group-hover:bg-[var(--text-primary)]/5',
    },
    {
      name: 'Facebook',
      username: 'bechirjalleli',
      url: 'https://facebook.com/bechirjalleli',
      icon: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
        </svg>
      ),
      color: 'group-hover:text-[#1877F2]',
      bg: 'group-hover:bg-[#1877F2]/5',
    },
  ];

  return (
    <section className="relative py-32 px-6 overflow-hidden bg-[var(--surface-primary)]">
      {/* Background Subtle Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50 dark:bg-indigo-900/10 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] -left-[5%] w-[30%] h-[30%] bg-blue-50 dark:bg-blue-900/10 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-[1500px] w-[94%] mx-auto">
        <div className="grid lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          {/* Left: Content */}
          <div className="lg:col-span-5">

            <h2 className="text-5xl md:text-6xl font-bold text-[var(--text-primary)] tracking-tight leading-[1.05] mb-8">
              {t('contact.title')} <span className="text-indigo-600 dark:text-indigo-400">{t('contact.titleAccent')}</span>
            </h2>

            <p className="text-xl text-[var(--text-secondary)] leading-relaxed mb-10 max-w-md">
              {t('contact.desc')}
            </p>

            {/* Email Box */}
            <div className="p-1 rounded-3xl bg-[var(--surface-secondary)] inline-block group">
              <div className="flex items-center gap-4 bg-[var(--surface-primary)] px-6 py-4 rounded-[22px] shadow-sm border border-[var(--border-tertiary)] transition-all group-hover:shadow-md group-hover:border-indigo-200 dark:group-hover:border-indigo-800">
                <div className="hidden sm:block">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] tracking-widest mb-0.5">{t('contact.emailLabel')}</div>
                  <div className="text-[var(--text-primary)] font-semibold">{email}</div>
                </div>
                <div className="w-px h-8 bg-[var(--border-tertiary)] mx-2 hidden sm:block"></div>
                <button 
                  onClick={handleCopyEmail}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 whitespace-nowrap
                    ${copied ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/20' : 'bg-[var(--text-primary)] text-[var(--surface-primary)] hover:bg-indigo-600 shadow-lg shadow-black/5'}
                  `}
                >
                  {copied ? (
                    <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg> {t('contact.copied')}</>
                  ) : (
                    <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2"/></svg> {t('contact.copyEmail')}</>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Social Cards */}
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group p-8 rounded-[32px] border border-[var(--border-tertiary)] bg-[var(--surface-primary)] shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-2 hover:border-indigo-100 dark:hover:border-indigo-900 ${social.bg}`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-[var(--surface-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] transition-all duration-500 group-hover:scale-110 group-hover:rotate-[-6deg] ${social.color}`}>
                  {social.icon}
                </div>
                
                <div className="mt-12 flex items-end justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">{social.name}</h3>
                    <p className="text-sm text-[var(--text-tertiary)] font-medium">{social.username}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-[var(--border-tertiary)] flex items-center justify-center text-[var(--text-tertiary)] transition-all group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:translate-x-1">
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                    </svg>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}