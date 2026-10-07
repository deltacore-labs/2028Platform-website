import { useState } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  {
    q: 'Wer kann an der Romwallfahrt teilnehmen?',
    a: 'Die Wallfahrt richtet sich an Ministrantinnen und Ministranten aus dem Bistum Mainz ab 12 Jahren. Auch Gruppenleiterinnen und Gruppenleiter können sich anmelden.',
  },
  {
    q: 'Was kostet die Teilnahme?',
    a: 'Der Teilnehmerbeitrag beträgt voraussichtlich 490 € und beinhaltet An- und Abreise, Unterkunft, Verpflegung und das Rahmenprogramm. Für Familien mit geringem Einkommen gibt es Fördermöglichkeiten – sprich dazu deinen Pfarrer oder deine Gruppe an.',
  },
  {
    q: 'Wie reisen wir nach Rom?',
    a: 'Die Anreise erfolgt per Zug oder Bus – gemeinschaftlich aus dem Bistum Mainz. Genaue Abfahrtsorte und -zeiten werden nach der Anmeldung bekanntgegeben.',
  },
  {
    q: 'Wann muss ich mich anmelden?',
    a: 'Die Anmeldung öffnet Anfang 2027. Frühzeitig informieren lohnt sich – erfahrungsgemäß sind die Plätze schnell vergeben.',
  },
  {
    q: 'Was sollte ich mitbringen?',
    a: 'Bequeme Laufschuhe, Sonnenschutz und natürlich dein Messgewand für die Gottesdienste. Eine detaillierte Packliste gibt es nach der Anmeldung in unserer App.',
  },
  {
    q: 'Gibt es eine App für die Wallfahrt?',
    a: 'Ja! Unsere offizielle Romwallfahrt-App für iOS und Android enthält den Programmplan, Gruppeninformationen, Notfallkontakte und tagesaktuelle Ankündigungen. Sie steht kurz vor der Wallfahrt zum Download bereit.',
  },
]

const highlights = [
  {
    icon: '🏛️',
    title: 'Petersdom & Vatikan',
    desc: 'Erlebe die Herzkammer der Weltkirche hautnah – Messe im Petersdom, Besuch der Vatikanischen Museen und die einzigartige Atmosphäre des Petersplatzes.',
  },
  {
    icon: '🙏',
    title: 'Papstaudienz',
    desc: 'Ein unvergesslicher Moment: die Generalaudienz mit Papst Franziskus auf dem Petersplatz, gemeinsam mit Hunderttausenden Gläubigen aus aller Welt.',
  },
  {
    icon: '⛏️',
    title: 'Katakomben',
    desc: 'Folge den Spuren der ersten Christinnen und Christen in den unterirdischen Grabanlagen Roms – Orte der Stille und des frühen Glaubens.',
  },
  {
    icon: '🏟️',
    title: 'Antikes Rom',
    desc: 'Kolosseum, Forum Romanum und Circus Maximus – Geschichte zum Anfassen. Rom ist ein lebendiges Geschichtsbuch.',
  },
  {
    icon: '✝️',
    title: 'Gemeinsame Liturgie',
    desc: 'Gottesdienste an heiligen Orten, Abendgebete als Gruppe und spirituelle Impulse geben der Reise ihren ganz besonderen Sinn.',
  },
  {
    icon: '🤝',
    title: 'Gemeinschaft',
    desc: 'Ministrantinnen und Ministranten aus dem ganzen Bistum Mainz lernen sich kennen. Freundschaften fürs Leben entstehen oft auf solchen Fahrten.',
  },
]

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-sm">
              ✞
            </div>
            <span className="font-bold text-gray-900 tracking-tight">Romwallfahrt 2028</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-500">
            <a href="#wallfahrt" className="hover:text-gray-900 transition-colors">Die Wallfahrt</a>
            <a href="#programm" className="hover:text-gray-900 transition-colors">Programm</a>
            <a href="#faq" className="hover:text-gray-900 transition-colors">FAQ</a>
          </nav>

          <Link
            to="/login"
            className="bg-red-700 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Anmelden
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-50 via-white to-white pointer-events-none" />
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, #dc2626 0%, transparent 60%), radial-gradient(circle at 80% 20%, #991b1b 0%, transparent 50%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 text-red-700 text-sm mb-8">
            <span>✦</span>
            <span>Bistum Mainz · BDKJ & BJA</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-none">
            Romwallfahrt
            <br />
            <span className="bg-gradient-to-r from-red-700 to-red-500 bg-clip-text text-transparent">
              2028
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto mb-4">
            Die Internationale Ministrantenwallfahrt nach Rom – für alle
            Ministrantinnen und Ministranten des Bistums Mainz.
          </p>
          <p className="text-lg text-red-700 font-semibold mb-10">
            31. Juli – 7. August 2028
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#wallfahrt"
              className="bg-red-700 hover:bg-red-600 text-white font-bold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Mehr erfahren
            </a>
            <a
              href="#faq"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors"
            >
              Häufige Fragen
            </a>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-y border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { val: '8', label: 'Tage in Rom' },
            { val: '400+', label: 'Teilnehmende' },
            { val: '2028', label: 'Sommer' },
            { val: '1', label: 'Unvergessliches Erlebnis' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="text-3xl font-extrabold text-red-700">{val}</div>
              <div className="text-sm text-gray-500 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="wallfahrt" className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-5">
              Was ist die{' '}
              <span className="text-red-700">Romwallfahrt?</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Alle vier Jahre pilgern Ministrantinnen und Ministranten aus aller Welt nach Rom –
              zum Herzen der katholischen Kirche. Zehntausende junge Menschen kommen zusammen,
              um gemeinsam zu beten, zu feiern und die Ewige Stadt zu erleben.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Das Bistum Mainz organisiert seit Jahrzehnten eigene Gruppen für diese besondere
              Wallfahrt. BDKJ und BJA begleiten die Reise professionell und sorgen dafür, dass
              jede und jeder sicher, gut verpflegt und spirituell bereichert nach Hause zurückkehrt.
            </p>
            <p className="text-gray-600 leading-relaxed">
              2028 ist es wieder so weit: Eine Woche Rom, voller Begegnungen, Gottesdienste an
              heiligen Stätten, Geschichte und unvergesslicher Gemeinschaft.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '🗺️', label: 'Reiseziel', val: 'Rom, Italien' },
              { icon: '📅', label: 'Termin', val: '31. Juli – 7. Aug. 2028' },
              { icon: '🧒', label: 'Mindestalter', val: 'ab 12 Jahren' },
              { icon: '🏠', label: 'Diözese', val: 'Bistum Mainz' },
              { icon: '🚌', label: 'Anreise', label2: '', val: 'Zug / Bus (gemeinsam)' },
              { icon: '✝️', label: 'Träger', val: 'BDKJ & BJA Mainz' },
            ].map(({ icon, label, val }) => (
              <div
                key={label}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
              >
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
                <div className="text-sm font-semibold text-gray-900">{val}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section id="programm" className="bg-gray-50 border-y border-gray-200 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Was uns erwartet</h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Acht Tage voller Glauben, Geschichte und Gemeinschaft – das ist die Romwallfahrt.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {highlights.map(({ icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-200 hover:border-red-300 rounded-2xl p-6 transition-colors shadow-sm"
              >
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who can join */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-bold mb-4">Wer kann mitmachen?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
            Die Wallfahrt ist offen für alle aktiven Ministrantinnen und Ministranten
            aus Pfarreien des Bistums Mainz, die im Sommer 2028 mindestens 12 Jahre alt sind.
            Gruppenleiterinnen und Gruppenleiter begleiten die Gruppen und können sich
            ebenfalls anmelden.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Ministranten ab 12 Jahren', 'Bistum Mainz', 'Mit Gruppe oder einzeln', 'Gruppenleiter willkommen'].map(tag => (
              <span
                key={tag}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-gray-50 border-y border-gray-200 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Häufige Fragen</h2>
            <p className="text-gray-500">Alles Wichtige auf einen Blick.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <span
                    className={`text-red-600 text-xl transition-transform ${openFaq === i ? 'rotate-45' : ''}`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-200 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App teaser */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">
              Die offizielle{' '}
              <span className="text-red-700">Wallfahrts-App</span>
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Für Teilnehmende und Gruppenleiter gibt es eine eigene App für iOS und Android.
              Darin findest du den tagesaktuellen Programmplan, Gruppeninformationen,
              Notfallkontakte und Push-Benachrichtigungen vom Miniteam – alles an einem Ort.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              {[
                'Tagesplanung und Programm',
                'Gruppen- und Lagerinfos',
                'Notfallkontakte',
                'Ankündigungen in Echtzeit',
              ].map(item => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-red-600">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-6xl mb-4">📱</div>
            <p className="text-gray-500 text-sm mb-4">
              Die App ist kurz vor der Wallfahrt im App Store und Google Play verfügbar.
            </p>
            <div className="flex gap-3 justify-center">
              <div className="bg-gray-100 border border-gray-200 rounded-xl px-5 py-2.5 text-sm text-gray-500">
                App Store
              </div>
              <div className="bg-gray-100 border border-gray-200 rounded-xl px-5 py-2.5 text-sm text-gray-500">
                Google Play
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-red-700 flex items-center justify-center text-white font-bold text-xs">
                  ✞
                </div>
                <span className="font-bold text-gray-900">Romwallfahrt 2028</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Die offizielle Website der Ministrantenwallfahrt des Bistums Mainz.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Veranstalter</h4>
              <address className="not-italic text-sm text-gray-500 leading-relaxed">
                BDKJ & BJA im Bistum Mainz<br />
                Am Fort Gonsenheim 54<br />
                55112 Mainz
              </address>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Kontakt</h4>
              <div className="text-sm text-gray-500 space-y-1">
                <div>📞 06131 2536-00</div>
                <div>✉️ bdkj-bja@bistum-mainz.de</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <span>© 2025 BDKJ & BJA im Bistum Mainz. Alle Rechte vorbehalten.</span>
            <Link to="/login" className="hover:text-gray-600 transition-colors">
              Teambereich
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
