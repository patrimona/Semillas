export default function IdleScreen() {
  return <main className="video-screen video-screen-white seed-idle-screen">
    <div className="video-stage idle-stage">
      <header className="archive-header">
        <p className="archive-vault">Bóveda global<br />de semillas<br />de Svalbard<span className="editorial-dash" aria-hidden="true" /></p>
        <p className="archive-collection">Premio Princesa de Asturias<br />de Cooperación Internacional<br />2026</p>
        <p className="archive-coordinates"><span aria-hidden="true">+</span>{'78.23583° N\n15.49139° E'}</p>
      </header>
      <svg className="technical-guides" viewBox="0 0 1024 1536" preserveAspectRatio="none" aria-hidden="true">
        <ellipse cx="512" cy="1040" rx="265" ry="245" strokeDasharray="4 7" />
        <path d="M46 34V134 M230 34V134 M918 34V134 M52 520V750 M962 880V1120 M52 1430V1502 M962 1430V1502" />
        <path d="M512 760V840 M512 1240V1390 M190 1040H280 M744 1040H834" strokeDasharray="2 5" />
      </svg>
      <h1 className="idle-heading"><span className="idle-heading-lead">Escanea el sobre</span>{' '}<span>para descubrir</span>{' '}<em>una semilla</em></h1>
      <div className="idle-scan-ripples" aria-hidden="true"><span /><span /><span /></div>
      <svg className="idle-envelope" viewBox="0 0 240 180" aria-hidden="true">
        <path d="M30 48H210V154H30Z M30 48L120 108L210 48 M30 154L87 105 M210 154L153 105" />
        <path className="idle-scan-lines" d="M94 28Q120 6 146 28 M106 38Q120 26 134 38" />
      </svg>
      <span className="idle-footer-line" aria-hidden="true" />
    </div>
  </main>
}
