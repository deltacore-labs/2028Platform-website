import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import appIcon from '../../../docs/favicon-192.png'

type LegalPageProps = { kind: 'privacy' | 'imprint' }

function LegalCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-[#ded9cf] bg-white p-6 shadow-[0_1px_0_rgba(23,19,15,0.03)] sm:p-8">
      <h2 className="font-display text-[clamp(1.7rem,3vw,2.25rem)] font-light leading-tight text-[#241e19]">{title}</h2>
      <div className="legal-copy mt-5 space-y-4 text-[14px] leading-[1.8] text-[#625b52] sm:text-[15px]">{children}</div>
    </section>
  )
}

function PrivacyContent() {
  return (
    <>
      <LegalCard title="1. Verantwortlicher">
        <address className="not-italic">
          Stefan Friedrich<br />
          Seckenheimer Landstraße 4A – 0138<br />
          Neuostheim<br />
          68163 Mannheim<br />
          Deutschland<br />
          E-Mail: <a href="mailto:delta.corelabs@gmail.com">delta.corelabs@gmail.com</a>
        </address>
        <p>Ein Datenschutzbeauftragter ist nicht bestellt, da keine gesetzliche Pflicht dazu besteht. Datenschutzanfragen kannst du direkt an die genannte E-Mail-Adresse richten.</p>
      </LegalCard>

      <LegalCard title="2. Bereitstellung der Website">
        <h3>Server-Protokolldaten</h3>
        <p>Beim Aufruf der Website verarbeitet der Hosting-Anbieter technisch erforderliche Verbindungsdaten. Dazu können IP-Adresse, Datum und Uhrzeit des Abrufs, aufgerufene Seite, übertragene Datenmenge, Referrer, Browsertyp, Browserversion und Betriebssystem gehören.</p>
        <p>Die Verarbeitung ist notwendig, um die Website auszuliefern und ihre Sicherheit und Stabilität zu gewährleisten. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und zuverlässigen Betrieb der Website.</p>
        <h3>Hosting</h3>
        <p>Das Hosting erfolgt über Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA. Weitere Informationen findest du in der <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von Cloudflare</a>. Protokolldaten werden nach den Vorgaben des Hosting-Anbieters gelöscht.</p>
        <h3>Keine Cookies oder Analyse</h3>
        <p>Diese Website setzt keine Cookies, verwendet keine Analyse- oder Werbedienste und bindet keine externen Schriftarten ein. Beim Aufruf der Startseite werden deshalb durch uns keine Marketingprofile erstellt.</p>
      </LegalCard>

      <LegalCard title="3. Datenverarbeitung in der App">
        <h3>Konto und Profil</h3>
        <p>Wenn du ein Konto erstellst oder dich anmeldest, werden je nach Nutzung insbesondere E-Mail-Adresse, Name, Bistum, Gruppe, Rolle und eine freiwillig beziehungsweise für bestimmte Rollen erforderliche Telefonnummer verarbeitet. Die Daten dienen der Anmeldung, Gruppenorganisation und Bereitstellung persönlicher Funktionen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
        <h3>Gastnutzung</h3>
        <p>Programm, Karte und lokale Werkzeuge können teilweise ohne persönliches Konto genutzt werden. Gewählte Einstellungen, Packlisten und weitere lokale Inhalte werden auf deinem Gerät gespeichert und können durch Löschen der App beziehungsweise der App-Daten entfernt werden.</p>
        <h3>Programm, Gruppen und Durchsagen</h3>
        <p>Zur Bereitstellung von Terminen, Gruppeninformationen und Durchsagen verarbeitet die App die deinem Konto oder deiner gewählten Organisation zugeordneten Daten. Dies erfolgt zur Durchführung und Organisation der Wallfahrt auf Grundlage von Art. 6 Abs. 1 lit. b und f DSGVO.</p>
        <h3>Chat und Medien</h3>
        <p>Chat-Nachrichten und Chat-Medien werden über einen Matrix-Homeserver verarbeitet. Der Zugriff auf Kamera, Fotomediathek und Mikrofon erfolgt nur, wenn du eine entsprechende Funktion verwendest und zuvor die Systemberechtigung erteilst. Bereits gesendete Nachrichten können entsprechend der Aufbewahrung im jeweiligen Matrix-Raum bestehen bleiben.</p>
        <h3>Standort und Notfallmeldungen</h3>
        <p>Die App fragt deinen Standort nur nach ausdrücklicher Systemfreigabe ab. Bei einer Notfallmeldung können Meldungsdaten, Kontaktdaten und – wenn du zustimmst – dein aktueller Standort an das zuständige Team übermittelt werden. Die Verarbeitung dient der Notfallhilfe. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. a, d und f DSGVO. Eine erteilte Einwilligung kannst du jederzeit in den Systemeinstellungen deines Geräts widerrufen.</p>
        <h3>Push-Benachrichtigungen</h3>
        <p>Wenn du Benachrichtigungen erlaubst, wird ein gerätebezogenes Push-Token verarbeitet, damit dir Durchsagen, Terminänderungen und – soweit aktiviert – Chat-Hinweise zugestellt werden können. Rechtsgrundlage ist deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Du kannst Benachrichtigungen jederzeit in den Systemeinstellungen deaktivieren.</p>
      </LegalCard>

      <LegalCard title="4. Eingesetzte Dienste und Empfänger">
        <h3>Firebase</h3>
        <p>Für Anmeldung und Push-Benachrichtigungen werden Dienste von Google Firebase eingesetzt. Dabei werden die für Authentifizierung und Zustellung erforderlichen Konto-, Geräte- und Verbindungsdaten verarbeitet.</p>
        <h3>Cloudflare</h3>
        <p>Die App-Schnittstelle und zugehörige Datenbankdienste werden über Cloudflare bereitgestellt. Cloudflare verarbeitet die für die Übertragung und Bereitstellung erforderlichen Daten als technischer Dienstleister.</p>
        <h3>Matrix</h3>
        <p>Für die Chatfunktion wird Matrix eingesetzt. Dabei werden Matrix-Kontodaten, Raummitgliedschaften, Nachrichten und gegebenenfalls hochgeladene Medien verarbeitet.</p>
        <h3>Apple und Google</h3>
        <p>Apple beziehungsweise Google werden einbezogen, wenn du die entsprechende Anmeldeoption, den jeweiligen App Store, Systemkarten oder Push-Infrastruktur verwendest. Es gelten ergänzend die Datenschutzhinweise des jeweiligen Anbieters.</p>
        <h3>OpenStreetMap und Photon</h3>
        <p>Bei der Ortssuche und Kartenanzeige können Kartendaten von OpenStreetMap und Suchergebnisse des Dienstes Photon (Komoot) geladen werden. Dabei werden technisch erforderliche Verbindungsdaten und die eingegebene Suchanfrage an den jeweiligen Anbieter übertragen. Exakte Notfallkoordinaten werden im Dashboard nicht automatisch an einen Kartendienst gesendet; erst das bewusste Öffnen eines externen Kartenlinks überträgt diese an den gewählten Anbieter.</p>
        <p>Eine Übermittlung in Drittländer kann nicht ausgeschlossen werden. Sie erfolgt nur auf Grundlage der gesetzlichen Voraussetzungen, insbesondere Angemessenheitsbeschlüssen oder geeigneten Garantien nach Art. 44 ff. DSGVO.</p>
      </LegalCard>

      <LegalCard title="5. Speicherdauer und Löschung">
        <p>Personenbezogene Daten werden nur so lange gespeichert, wie sie für Wallfahrt, Sicherheit, Support und gesetzliche Pflichten benötigt werden. Anschließend werden sie gelöscht oder anonymisiert.</p>
        <p>Dein App-Konto und zugehörige personenbezogene App-Daten kannst du im Profil über die Funktion „Konto dauerhaft löschen“ entfernen. Lokale Daten entfernst du durch Löschen der App oder ihrer App-Daten. Bereits versendete Chat-Nachrichten können entsprechend der Aufbewahrung des Matrix-Raums fortbestehen; für individuelle Löschanfragen wende dich bitte an den Support.</p>
      </LegalCard>

      <LegalCard title="6. Deine Rechte">
        <p>Du hast unter den gesetzlichen Voraussetzungen insbesondere folgende Rechte:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Auskunft über deine verarbeiteten Daten nach Art. 15 DSGVO</li>
          <li>Berichtigung unrichtiger Daten nach Art. 16 DSGVO</li>
          <li>Löschung nach Art. 17 DSGVO</li>
          <li>Einschränkung der Verarbeitung nach Art. 18 DSGVO</li>
          <li>Datenübertragbarkeit nach Art. 20 DSGVO</li>
          <li>Widerspruch gegen Verarbeitungen nach Art. 21 DSGVO</li>
          <li>Widerruf einer Einwilligung mit Wirkung für die Zukunft nach Art. 7 Abs. 3 DSGVO</li>
        </ul>
        <p>Du kannst dich außerdem bei einer Datenschutzaufsichtsbehörde beschweren. Zuständig ist insbesondere der <strong>Hessische Beauftragte für Datenschutz und Informationsfreiheit</strong>, Gustav-Stresemann-Ring 1, 65189 Wiesbaden, <a href="https://datenschutz.hessen.de" target="_blank" rel="noopener noreferrer">datenschutz.hessen.de</a>.</p>
      </LegalCard>

      <LegalCard title="7. Widerspruch nach Art. 21 DSGVO">
        <p>Soweit eine Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, kannst du aus Gründen, die sich aus deiner besonderen Situation ergeben, jederzeit widersprechen. Wir verarbeiten die betroffenen Daten dann nicht mehr, es sei denn, zwingende schutzwürdige Gründe überwiegen deine Interessen, Rechte und Freiheiten oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.</p>
        <p>Richte Datenschutzanfragen bitte an <a href="mailto:delta.corelabs@gmail.com">delta.corelabs@gmail.com</a>.</p>
      </LegalCard>
    </>
  )
}

function ImprintContent() {
  return (
    <>
      <LegalCard title="Angaben gemäß § 5 DDG">
        <address className="not-italic">
          Stefan Friedrich<br />
          Seckenheimer Landstraße 4A – 0138<br />
          Neuostheim<br />
          68163 Mannheim<br />
          Deutschland
        </address>
      </LegalCard>

      <LegalCard title="Kontakt">
        <p>E-Mail: <a href="mailto:delta.corelabs@gmail.com">delta.corelabs@gmail.com</a><br />Instagram: <a href="https://www.instagram.com/delta.corelabs" target="_blank" rel="noopener noreferrer">@delta.corelabs</a></p>
        <p>Eine Umsatzsteuer-Identifikationsnummer liegt nicht vor, da es sich nicht um ein gewerbliches Angebot handelt.</p>
      </LegalCard>

      <LegalCard title="Verantwortlich für den Inhalt">
        <address className="not-italic">Stefan Friedrich<br />Anschrift wie oben</address>
        <p>Kontakt: <a href="mailto:delta.corelabs@gmail.com">delta.corelabs@gmail.com</a></p>
      </LegalCard>

      <LegalCard title="Urheberrecht">
        <p>Die durch den Anbieter erstellten Inhalte und Werke auf dieser Website unterliegen dem deutschen Urheberrecht. Inhalte Dritter sind als solche gekennzeichnet. Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Rechteinhabers.</p>
        <p>Marken, Produktnamen und Logos Dritter sind Eigentum ihrer jeweiligen Inhaber.</p>
      </LegalCard>

      <LegalCard title="Haftung für Inhalte und Links">
        <p>Die Inhalte dieser Website wurden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität kann dennoch keine Gewähr übernommen werden. Die in der App bereitgestellten Veranstaltungs-, Orts- und Notfallinformationen ersetzen nicht die Hinweise der Reiseleitung, der zuständigen Stellen oder offizieller Behörden.</p>
        <p>Diese Website kann Links zu externen Websites enthalten, auf deren Inhalte kein Einfluss besteht. Für diese fremden Inhalte ist stets der jeweilige Anbieter verantwortlich. Bei Bekanntwerden von Rechtsverletzungen werden entsprechende Links entfernt.</p>
      </LegalCard>
    </>
  )
}

export function LegalPage({ kind }: LegalPageProps) {
  const isPrivacy = kind === 'privacy'

  return (
    <div className="min-h-dvh bg-[#f5f2ec] text-[#17130f]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-white focus:px-4 focus:py-2">Zum Inhalt springen</a>
      <header className="sticky top-0 z-50 border-b border-[#ded9cf]/80 bg-[#f5f2ec]/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1080px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Zur Startseite">
            <img src={appIcon} width="36" height="36" alt="" className="rounded-[0.65rem]" />
            <span className="font-display text-[21px] font-light">Rom 2028</span>
          </Link>
          <Link to="/" className="text-[13px] font-medium text-[#6f685e] transition-colors hover:text-[#17130f]">← Zur Startseite</Link>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-[1080px] px-5 py-16 sm:px-8 sm:py-24">
        <header className="max-w-[760px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#8b4a37]">Rechtliches</p>
          <h1 className="mt-5 font-display text-[clamp(3.4rem,8vw,6.5rem)] font-light leading-[0.9] tracking-[-0.035em]">{isPrivacy ? 'Datenschutz' : 'Impressum'}</h1>
          <p className="mt-7 max-w-[650px] text-[17px] leading-[1.7] text-[#625b52]">{isPrivacy ? 'Hier erfährst du, welche Daten bei der Nutzung dieser Website und der App Rom 2028 verarbeitet werden.' : 'Angaben zum Anbieter dieser Website und der App Rom 2028.'}</p>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-[#d8d1c5] pt-5 text-[11px] font-medium uppercase tracking-[0.12em] text-[#898277]">
            <span>Stand: 7. November 2026</span>
            <span>{isPrivacy ? 'Gilt für Website und App' : 'Privates, nicht-kommerzielles Projekt'}</span>
          </div>
        </header>

        <div className="my-12 rounded-[1.5rem] bg-[#1d1916] p-6 text-[14px] leading-[1.8] text-white/70 sm:p-8 sm:text-[15px]">
          {isPrivacy
            ? <p><strong className="text-white">Kurzfassung:</strong> Wir setzen auf Datensparsamkeit. Die Website verwendet keine Cookies, keine Werbung und kein eigenes Nutzertracking. In der App werden nur Daten verarbeitet, die für Konto, Organisation, Kommunikation, Benachrichtigungen und Notfallhilfe erforderlich sind.</p>
            : <p><strong className="text-white">Kurz gesagt:</strong> Rom 2028 wird als privates, nicht-kommerzielles Projekt entwickelt. Bei Fragen erreichst du uns am schnellsten per E-Mail.</p>}
        </div>

        <div className="grid gap-5">{isPrivacy ? <PrivacyContent /> : <ImprintContent />}</div>

        <p className="mt-8 rounded-2xl border border-[#d8d1c5] px-5 py-4 text-[12px] leading-[1.7] text-[#7a7268]">
          {isPrivacy
            ? 'Diese Datenschutzerklärung berücksichtigt die derzeit im Projekt eingesetzten Funktionen und Dienste. Sie sollte vor Veröffentlichung und bei technischen Änderungen erneut geprüft werden.'
            : 'Hinweis: Kontaktdaten und Anbieterangaben wurden auf Grundlage der bereitgestellten Referenzseiten übernommen.'}
        </p>
      </main>

      <footer className="border-t border-[#ded9cf] px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-8 sm:px-8">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-4 text-[11px] text-[#898277] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Rom 2028</span>
          <div className="flex gap-5">
            <Link to={isPrivacy ? '/impressum' : '/datenschutz'} className="hover:text-[#17130f]">{isPrivacy ? 'Impressum' : 'Datenschutz'}</Link>
            <Link to="/" className="hover:text-[#17130f]">Startseite</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
