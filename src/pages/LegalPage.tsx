import { Link } from 'react-router-dom'

type LegalPageProps = { kind: 'privacy' | 'imprint' }

const privacySections = [
  ['Verantwortliche Stelle', 'BDKJ & BJA im Bistum Mainz, Am Fort Gonsenheim 54, 55122 Mainz, E-Mail: bdkj-bja@bistum-mainz.de.'],
  ['Verarbeitete Daten', 'Je nach Nutzung verarbeiten wir Kontodaten, Name, Bistum und Gruppe, Geräte- und Push-Token, freiwillige Telefonnummern sowie bei Notfallmeldungen Standort-, Kontakt- und Meldungsdaten. Chat-Nachrichten werden über den eingesetzten Matrix-Server verarbeitet.'],
  ['Zwecke und Rechtsgrundlagen', 'Die Verarbeitung dient der Durchführung der Wallfahrt, der Gruppenorganisation, Kommunikation und Notfallhilfe. Rechtsgrundlagen sind Art. 6 Abs. 1 lit. b, d und f DSGVO sowie – insbesondere bei Standortzugriff und Benachrichtigungen – deine Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO.'],
  ['Empfänger und Dienste', 'Für Anmeldung und Push-Benachrichtigungen nutzen wir Firebase, für die App-API Cloudflare und für den Chat Matrix. Apple oder Google werden nur einbezogen, wenn du den jeweiligen Login auswählst. Die Übermittlung erfolgt jeweils nur im erforderlichen Umfang.'],
  ['Speicherdauer und Kontolöschung', 'Wir speichern personenbezogene Daten nur so lange, wie sie für Durchführung, Sicherheit und gesetzliche Pflichten benötigt werden. In der App kannst du dein Konto im Profil dauerhaft löschen. Dabei werden das Login und personenbezogene App-Daten entfernt beziehungsweise notwendige Vorgangsdaten anonymisiert. Bereits gesendete Chat-Nachrichten bleiben entsprechend der Aufbewahrung des jeweiligen Matrix-Raums erhalten; wende dich für deren Entfernung an den Support.'],
  ['Deine Rechte', 'Du hast insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch. Einwilligungen kannst du jederzeit für die Zukunft widerrufen. Außerdem kannst du dich bei einer Datenschutzaufsichtsbehörde beschweren.'],
] as const

export function LegalPage({ kind }: LegalPageProps) {
  const isPrivacy = kind === 'privacy'
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-red-100">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold">Romwallfahrt 2028</Link>
          <Link to="/" className="text-sm text-red-700 hover:underline">Zur Startseite</Link>
        </div>
      </header>
      <article className="max-w-3xl mx-auto px-6 py-14">
        <h1 className="text-4xl font-bold mb-2">{isPrivacy ? 'Datenschutzerklärung' : 'Impressum'}</h1>
        <p className="text-sm text-gray-500 mb-10">Stand: 22. Oktober 2026</p>
        {isPrivacy ? (
          <div className="space-y-8">
            {privacySections.map(([title, body]) => (
              <section key={title}>
                <h2 className="text-xl font-bold mb-2">{title}</h2>
                <p className="text-gray-600 leading-relaxed">{body}</p>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-8 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Anbieter</h2>
              <address className="not-italic">
                BDKJ &amp; BJA im Bistum Mainz<br />
                Am Fort Gonsenheim 54<br />
                55122 Mainz
              </address>
            </section>
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Kontakt</h2>
              <p>Telefon: 06131 2536-00<br />E-Mail: <a className="text-red-700 underline" href="mailto:bdkj-bja@bistum-mainz.de">bdkj-bja@bistum-mainz.de</a></p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Inhaltlich verantwortlich</h2>
              <p>BDKJ &amp; BJA im Bistum Mainz, Anschrift wie oben.</p>
            </section>
          </div>
        )}
      </article>
    </main>
  )
}
