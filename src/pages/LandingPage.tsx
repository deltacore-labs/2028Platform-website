import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../../../docs/style.css'
import appIcon from '../../../docs/favicon-192.png'
import homeLight from '../../../docs/Home_White.jpg'
import homeDark from '../../../docs/Home_Dark.jpg'
import mapDark from '../../../docs/Karte_Dark.jpg'
import toolsLight from '../../../docs/Mehr_White.jpg'
import sosDark from '../../../docs/SOS_Dark.jpg'
import appStoreBadge from '../../../docs/Download_on_the_App_Store_Badge_DE_RGB_wht_092917.svg'
import googlePlayBadge from '../../../docs/lockup_Google_Play_CMYK_color_horizontal_688x140px.png'

const formattedDate = new Intl.DateTimeFormat('de-DE', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
}).format(new Date())

const currentDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="app-marketing-page">
      <a className="skip-link" href="#main">Zum Inhalt springen</a>
      <header className="site-header">
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="Rom 2028 Startseite">
            <img src={appIcon} width="38" height="38" alt="" />
            <span>Rom 2028</span>
          </a>
          <nav className="desktop-nav" aria-label="Hauptnavigation">
            <a href="#funktionen">Funktionen</a>
            <a href="#sicherheit">Sicherheit</a>
            <a href="#fragen">Fragen</a>
            <Link to="/login">Teambereich</Link>
          </nav>
          <a className="nav-cta" href="#download">Zur App <span aria-hidden="true">↘</span></a>
          <button className="menu-button" type="button" aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'} aria-expanded={menuOpen} onClick={() => setMenuOpen(open => !open)}>
            <span /><span />
          </button>
        </div>
        <nav className="mobile-menu" aria-label="Mobile Navigation" hidden={!menuOpen}>
          <a href="#funktionen" onClick={closeMenu}>Funktionen</a>
          <a href="#sicherheit" onClick={closeMenu}>Sicherheit</a>
          <a href="#fragen" onClick={closeMenu}>Fragen</a>
          <a href="#download" onClick={closeMenu}>Zur App</a>
          <Link to="/login" onClick={closeMenu}>Teambereich</Link>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="hero-copy">
            <div className="eyebrow"><span />Dein Begleiter für Rom</div>
            <h1>Gemeinsam unterwegs.<br /><em>Alles dabei.</em></h1>
            <p className="hero-lead">Programm, Treffpunkte, deine Gruppe und schnelle Hilfe im Notfall – Rom 2028 bringt alles zusammen, was du unterwegs brauchst.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#download">App entdecken <span aria-hidden="true">↓</span></a>
              <a className="button button-secondary" href="#funktionen">Funktionen ansehen</a>
            </div>
            <p className="availability"><span />Für iOS und Android · Veröffentlichung vor der Wallfahrt</p>
          </div>

          <div className="hero-visual" aria-label="Vorschau der Rom 2028 App">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="phone screenshot-phone">
              <div className="phone-frame">
                <img src={homeLight} width="1178" height="2442" alt="Startseite der Rom 2028 App mit nächstem Event und Schnellzugriffen" />
                <div className="live-date live-date-light" aria-label="Aktuelles Datum"><strong>Heute</strong><span>{currentDate}</span></div>
              </div>
            </div>
            <div className="floating-card floating-chat"><span>●</span><div><b>Echte App-Ansicht</b><small>Hell und klar für unterwegs</small></div></div>
            <div className="floating-card floating-route"><span>＋</span><div><b>SOS immer erreichbar</b><small>Direkt aus jeder Ansicht</small></div></div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Vorteile">
          <div><strong>Einfach</strong><span>Alles an einem Ort</span></div>
          <div><strong>Sicher</strong><span>Hilfe, wenn sie zählt</span></div>
          <div><strong>Verbunden</strong><span>Mit deiner Gruppe</span></div>
          <div><strong>Unterwegs</strong><span>Auch als Gast nutzbar</span></div>
        </section>

        <section className="section features" id="funktionen">
          <div className="section-intro">
            <div><span className="kicker">Alles in einer App</span><h2>Weniger suchen.<br />Mehr erleben.</h2></div>
            <p>Die wichtigen Informationen deiner Wallfahrt sind dort, wo du sie brauchst: direkt auf deinem Smartphone.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-card feature-large feature-program">
              <div><span className="feature-number">01</span><h3>Dein Tag auf einen Blick</h3><p>Termine, Programmänderungen und Treffpunkte sind immer aktuell und übersichtlich sortiert.</p></div>
              <div className="screen-preview screen-preview-home">
                <img src={homeDark} width="1178" height="2437" loading="lazy" alt="Dunkle Startansicht der Rom 2028 App" />
                <div className="live-date live-date-dark" aria-hidden="true"><strong>Heute</strong><span>{currentDate}</span></div>
              </div>
            </article>
            <article className="feature-card feature-chat">
              <span className="feature-number">02</span><div className="feature-icon">◌</div><h3>Gemeinsam verbunden</h3><p>Absprachen und wichtige Nachrichten bleiben im geschützten Gruppenchat bei euch.</p>
            </article>
            <article className="feature-card feature-map">
              <span className="feature-number">03</span><div className="screen-preview screen-preview-map"><img src={mapDark} width="1178" height="2437" loading="lazy" alt="Karte von Rom mit Orten und Wasserstellen in der App" /></div><h3>Rom sicher entdecken</h3><p>Orte, Wege und Treffpunkte helfen dir, schnell wieder bei deiner Gruppe zu sein.</p>
            </article>
            <article className="feature-card feature-wide">
              <div><span className="feature-number">04</span><h3>Mehr als nur ein Programm</h3><p>Packliste, Lieder und Texte, Quiz-Tour und persönliche Einstellungen begleiten dich vor und während der Reise.</p></div>
              <div className="screen-preview screen-preview-tools"><img src={toolsLight} width="1178" height="2440" loading="lazy" alt="Werkzeuge und Personalisierung in der Rom 2028 App" /></div>
            </article>
          </div>
        </section>

        <section className="safety" id="sicherheit">
          <div className="safety-copy">
            <span className="kicker kicker-light">Wenn es darauf ankommt</span>
            <h2>Hilfe ist nur einen Schritt entfernt.</h2>
            <p>Die Notfallfunktion führt dich klar durch die wichtigsten Schritte. Auf Wunsch übermittelst du deinen Standort direkt an das zuständige Team.</p>
            <ul>
              <li><span>✓</span>Direkter Zugang zu Notfallkontakten</li>
              <li><span>✓</span>Standortfreigabe nur nach deiner Zustimmung</li>
              <li><span>✓</span>Rollenbasierte Informationen für deine Gruppe</li>
            </ul>
          </div>
          <div className="safety-panel safety-screenshot-panel">
            <div className="safety-phone"><img src={sosDark} width="1178" height="2435" loading="lazy" alt="SOS- und Hilfeansicht der Rom 2028 App" /></div>
            <div className="privacy-pill"><span>●</span> Dein Standort bleibt privat, bis du ihn freigibst.</div>
          </div>
        </section>

        <section className="section faq-section" id="fragen">
          <div className="faq-heading"><span className="kicker">Gut zu wissen</span><h2>Noch Fragen?</h2><p>Die wichtigsten Antworten zur App findest du hier.</p></div>
          <div className="faq-list">
            <details open><summary>Wann kann ich die App herunterladen?<span>+</span></summary><p>Die App wird rechtzeitig vor der Wallfahrt für iOS und Android bereitgestellt. Den Download-Link findest du dann auf dieser Seite.</p></details>
            <details><summary>Brauche ich zwingend ein Konto?<span>+</span></summary><p>Nein. Programm, Karte und einige Werkzeuge kannst du auch als Gast nutzen. Für persönliche Gruppeninfos, Chat und Benachrichtigungen ist ein Konto erforderlich.</p></details>
            <details><summary>Funktioniert die App auch ohne Internet?<span>+</span></summary><p>Bereits geladene Inhalte und lokale Werkzeuge bleiben teilweise verfügbar. Für neue Durchsagen, Chatnachrichten und aktuelle Änderungen braucht die App eine Verbindung.</p></details>
            <details><summary>Wie werden meine Daten geschützt?<span>+</span></summary><p>Die App verarbeitet nur Daten, die für Organisation, Kommunikation und Sicherheit nötig sind. Standortdaten werden nur mit deiner Zustimmung genutzt. Einzelheiten findest du in der Datenschutzerklärung.</p></details>
          </div>
        </section>

        <section className="download-section" id="download">
          <div className="download-glow" />
          <img src={appIcon} width="76" height="76" alt="Rom 2028 App-Icon" />
          <span className="kicker kicker-light">Rom 2028</span>
          <h2>Rom beginnt nicht erst<br />mit der Ankunft.</h2>
          <p>Bereite dich vor, bleib verbunden und hab unterwegs alles Wichtige bei dir.</p>
          <div className="store-row">
            <div className="store-badge store-badge-original store-badge-apple-original" aria-label="Laden im Apple App Store"><img src={appStoreBadge} width="180" height="60" alt="Laden im App Store" /></div>
            <div className="store-badge store-badge-original store-badge-google-original" aria-label="Bei Google Play erhältlich"><img src={googlePlayBadge} width="206" height="42" alt="Google Play" /></div>
          </div>
          <small className="download-note">Die Store-Links werden ergänzt, sobald die App verfügbar ist.</small>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><a className="brand" href="#top"><img src={appIcon} width="38" height="38" alt="" /><span>Rom 2028</span></a><p>Dein digitaler Begleiter für eine gemeinsame Reise.</p></div>
          <div><h3>Navigation</h3><a href="#funktionen">Funktionen</a><a href="#sicherheit">Sicherheit</a><a href="#fragen">Fragen</a><Link to="/login">Teambereich</Link></div>
          <div><h3>Rechtliches</h3><Link to="/datenschutz">Datenschutz</Link><Link to="/impressum">Impressum</Link></div>
          <div><h3>Kontakt</h3><a href="mailto:delta.corelabs@gmail.com">E-Mail schreiben</a><a href="https://www.instagram.com/delta.corelabs" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Rom 2028</span><span>Mit Sorgfalt für unterwegs gemacht.</span></div>
      </footer>
    </div>
  )
}
