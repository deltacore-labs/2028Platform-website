import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

const faqs = [
  { q: 'Wer kann an der Romwallfahrt teilnehmen?', a: 'Die Wallfahrt richtet sich an Ministrantinnen und Ministranten aus dem Bistum Mainz ab 12 Jahren. Auch Gruppenleiterinnen und Gruppenleiter können sich anmelden.' },
  { q: 'Was kostet die Teilnahme?', a: 'Der Teilnehmerbeitrag beträgt voraussichtlich 490 € und beinhaltet An- und Abreise, Unterkunft, Verpflegung und das Rahmenprogramm. Für Familien mit geringem Einkommen gibt es Fördermöglichkeiten – sprich dazu deine Pfarrei oder Gruppe an.' },
  { q: 'Wie reisen wir nach Rom?', a: 'Die Anreise erfolgt per Zug oder Bus – gemeinschaftlich aus dem Bistum Mainz. Genaue Abfahrtsorte und -zeiten werden nach der Anmeldung bekanntgegeben.' },
  { q: 'Wann muss ich mich anmelden?', a: 'Die Anmeldung öffnet Anfang 2027. Frühzeitig informieren lohnt sich – erfahrungsgemäß sind die Plätze schnell vergeben.' },
  { q: 'Was sollte ich mitbringen?', a: 'Bequeme Laufschuhe, Sonnenschutz und natürlich dein Messgewand für die Gottesdienste. Eine detaillierte Packliste gibt es nach der Anmeldung in unserer App.' },
  { q: 'Gibt es eine App für die Wallfahrt?', a: 'Ja. Die offizielle Romwallfahrt-App für iOS und Android enthält Programm, Gruppeninformationen, Notfallkontakte und tagesaktuelle Ankündigungen. Sie steht kurz vor der Wallfahrt zum Download bereit.' },
]

const highlights = [
  { number: '01', title: 'Petersdom & Vatikan', desc: 'Die Herzkammer der Weltkirche: Gottesdienst, Petersplatz und die besondere Atmosphäre des Vatikans.' },
  { number: '02', title: 'Papstaudienz', desc: 'Ein gemeinsamer Moment mit jungen Gläubigen aus aller Welt – mitten auf dem Petersplatz.' },
  { number: '03', title: 'Katakomben', desc: 'Auf den Spuren der ersten Christinnen und Christen: stille Orte und die Wurzeln unseres Glaubens.' },
  { number: '04', title: 'Antikes Rom', desc: 'Kolosseum, Forum Romanum und Circus Maximus machen zweitausend Jahre Geschichte greifbar.' },
  { number: '05', title: 'Gemeinsame Liturgie', desc: 'Gottesdienste, Abendgebete und Impulse geben jedem Tag einen gemeinsamen Rhythmus.' },
  { number: '06', title: 'Neue Gemeinschaft', desc: 'Begegnungen über Pfarreigrenzen hinweg – und Erinnerungen, die weit über Rom hinaus bleiben.' },
]

function ArrowIcon({ down = false }: { down?: boolean }) {
  return (
    <svg className={`h-4 w-4 ${down ? 'rotate-90' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 10h13M11 5l5 5-5 5" />
    </svg>
  )
}

function CheckIcon() {
  return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#e2ebe2] text-[#35533a]"><svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 8 3 3 7-7" /></svg></span>
}

function LineIcon({ name }: { name: 'pin' | 'calendar' | 'people' | 'cross' }) {
  const paths = {
    pin: <><path d="M17 10c0 5-7 11-7 11S3 15 3 10a7 7 0 1 1 14 0Z" /><circle cx="10" cy="10" r="2.2" /></>,
    calendar: <><rect x="2.5" y="4" width="15" height="14" rx="2.5" /><path d="M6 2v4m8-4v4M2.5 8h15" /></>,
    people: <><circle cx="7.5" cy="7" r="3" /><path d="M2.5 18v-1.3a4.2 4.2 0 0 1 4.2-4.2h1.6a4.2 4.2 0 0 1 4.2 4.2V18M13 5.2a2.7 2.7 0 0 1 0 5.2m1 2.2a3.8 3.8 0 0 1 3.5 3.8V18" /></>,
    cross: <path d="M8 2h4v5h5v4h-5v8H8v-8H3V7h5V2Z" />,
  }
  return <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

function DetailCard({ label, value, children }: { label: string; value: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#ded9cf] bg-[#f8f6f1] p-5 transition-[background-color,border-color,transform] duration-200 active:scale-[0.99] sm:p-6">
      <div className="mb-7 grid h-10 w-10 place-items-center rounded-full bg-white text-[#4e493f] shadow-[0_1px_0_rgba(23,19,15,0.06),0_5px_16px_rgba(23,19,15,0.05)]">{children}</div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#898277]">{label}</p>
      <p className="mt-1.5 text-[15px] font-medium leading-snug text-[#17130f]">{value}</p>
    </div>
  )
}

export function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-dvh overflow-hidden bg-[#f5f2ec] text-[#17130f]">
      <header className="sticky top-0 z-50 border-b border-[#ded9cf]/80 bg-[#f5f2ec]/90 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <a href="#top" className="flex items-center gap-3" aria-label="Romwallfahrt 2028 – Startseite"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#1f1a16] text-[14px] text-white shadow-[0_4px_14px_rgba(31,26,22,0.14)]">✞</span><span className="font-display text-[21px] font-light tracking-[-0.01em]">Rom 2028</span></a>
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#6f685e] md:flex" aria-label="Seitennavigation"><a href="#wallfahrt" className="transition-colors hover:text-[#17130f]">Die Wallfahrt</a><a href="#programm" className="transition-colors hover:text-[#17130f]">Erlebnisse</a><a href="#app" className="transition-colors hover:text-[#17130f]">App</a><a href="#faq" className="transition-colors hover:text-[#17130f]">Fragen</a></nav>
          <Link to="/login" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#1f1a16] px-4 text-[13px] font-medium text-white shadow-[0_5px_18px_rgba(31,26,22,0.14)] transition-[background-color,transform] hover:bg-[#342c26] active:scale-[0.97] sm:px-5"><span className="hidden sm:inline">Teambereich</span><span className="sm:hidden">Login</span><ArrowIcon /></Link>
        </div>
      </header>

      <main id="top">
        <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden border-b border-[#ded9cf]">
          <div className="landing-orb landing-orb-mint absolute -left-24 top-0 -z-10 h-[360px] w-[360px] rounded-full sm:h-[520px] sm:w-[520px]" />
          <div className="landing-orb landing-orb-peach absolute -right-32 bottom-[-80px] -z-10 h-[420px] w-[420px] rounded-full sm:h-[620px] sm:w-[620px]" />
          <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1240px] items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-24">
            <div className="max-w-[680px]">
              <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[#d8d1c5] bg-white/55 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#716a60] shadow-[0_1px_0_rgba(23,19,15,0.03)] backdrop-blur"><span className="h-1.5 w-1.5 rounded-full bg-[#9b4d38]" />Bistum Mainz · Sommer 2028</div>
              <h1 className="max-w-[760px] font-display text-[clamp(3.85rem,9vw,7.8rem)] font-light leading-[0.84] tracking-[-0.045em]">Sieben Tage.<span className="ml-[0.45em] block italic text-[#8b4a37]">Eine Ewigkeit.</span></h1>
              <p className="mt-8 max-w-[560px] text-[17px] leading-[1.65] text-[#5e574e] sm:text-[19px]">Die Ministrantenwallfahrt des Bistums Mainz führt uns 2028 nach Rom – zu großen Orten, stillen Momenten und einer Gemeinschaft, die bleibt.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="#wallfahrt" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#1f1a16] px-6 text-[14px] font-medium text-white transition-[background-color,transform] hover:bg-[#342c26] active:scale-[0.97]">Wallfahrt entdecken <ArrowIcon down /></a><a href="#faq" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cfc8bd] bg-white/45 px-6 text-[14px] font-medium text-[#2b2520] transition-[background-color,border-color,transform] hover:border-[#aaa195] hover:bg-white/75 active:scale-[0.97]">Fragen & Antworten</a></div>
              <div className="mt-12 flex items-center gap-5 border-t border-[#d8d1c5] pt-5 text-[12px] text-[#716a60]"><span className="font-medium text-[#2b2520]">31. Juli – 7. August</span><span className="h-3 w-px bg-[#cfc8bd]" /><span>Rom, Italien</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-[520px] lg:ml-auto">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/60 bg-[#c9a18d] shadow-[0_30px_80px_rgba(65,45,33,0.18)]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_18%,rgba(248,223,194,0.95),transparent_34%),radial-gradient(circle_at_78%_28%,rgba(199,192,210,0.9),transparent_37%),linear-gradient(160deg,#d6a88f_0%,#b87966_48%,#6f5048_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#29201c] via-[#49342c]/90 to-transparent" />
                <svg className="absolute inset-x-[7%] bottom-[9%] h-[54%] w-[86%] text-[#1d1815]/90" viewBox="0 0 520 360" fill="currentColor" aria-hidden="true"><path d="M20 330V184h54v-34h52v34h48v146H20Zm20-116h28v116H40V214Zm54 0h28v116H94V214Zm54 0h8v116h-8V214ZM205 330V132h32V91h18V50h20v41h18v41h32v198H205Zm30-168h16v168h-16V162Zm42 0h16v168h-16V162ZM350 330V208h38v-52h14v-31h17v31h14v52h52v122H350Zm25-94h24v94h-24v-94Zm55 0h24v94h-24v-94Z" /><path d="M0 330h520v30H0z" /></svg>
                <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/15 px-3.5 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:left-7 sm:top-7">Romwallfahrt 2028</div>
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-5 text-white sm:bottom-8 sm:left-8 sm:right-8"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">Unser Ziel</p><p className="mt-1 font-display text-[34px] font-light leading-none">Roma</p></div><span className="text-right text-[11px] leading-relaxed text-white/65">41° 54′ N<br />12° 29′ E</span></div>
              </div>
              <div className="absolute -bottom-6 -left-3 rounded-2xl border border-white/70 bg-[#f8f6f1]/90 p-4 shadow-[0_12px_40px_rgba(36,28,23,0.12)] backdrop-blur-md sm:-left-8 sm:p-5"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#898277]">Unser gemeinsamer Weg</p><p className="mt-1 font-display text-[27px] font-light text-[#251f1b]">Eine Reise, die bleibt.</p></div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#ded9cf] bg-[#1d1916] text-white"><div className="mx-auto grid max-w-[1240px] grid-cols-2 divide-x divide-white/10 px-5 sm:px-8 lg:grid-cols-4 lg:px-10">{[['8', 'Tage unterwegs'], ['400+', 'junge Menschen'], ['1.200 km', 'bis nach Rom'], ['∞', 'Erinnerungen']].map(([value, label], index) => <div key={label} className={`py-8 text-center sm:py-10 ${index >= 2 ? 'border-t border-white/10 lg:border-t-0' : ''}`}><p className="font-display text-[35px] font-light leading-none sm:text-[42px]">{value}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45 sm:text-[11px]">{label}</p></div>)}</div></section>

        <section id="wallfahrt" className="scroll-mt-20"><div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20"><div><p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#8b4a37]">Die Wallfahrt</p><h2 className="mt-5 max-w-md font-display text-[clamp(2.8rem,5vw,4.6rem)] font-light leading-[0.98] tracking-[-0.025em]">Rom ist mehr als ein Reiseziel.</h2></div><div className="max-w-[680px] lg:pt-11"><p className="font-display text-[27px] font-light leading-[1.3] text-[#302923] sm:text-[32px]">Alle vier Jahre wird die Ewige Stadt zum Treffpunkt für Ministrantinnen und Ministranten aus aller Welt. 2028 sind wir dabei.</p><div className="mt-8 grid gap-5 text-[15px] leading-[1.75] text-[#645d54] sm:grid-cols-2"><p>Gemeinsam feiern wir Gottesdienste an besonderen Orten, entdecken Geschichte und erleben, wie groß und vielfältig Kirche sein kann.</p><p>BDKJ und BJA begleiten die Reise vom ersten Treffen bis zur Rückkehr – gut organisiert, sicher und mit Raum für echte Begegnung.</p></div></div></div>
          <div className="mt-16 grid gap-3 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4"><DetailCard label="Reiseziel" value="Rom, Italien"><LineIcon name="pin" /></DetailCard><DetailCard label="Termin" value="31. Juli – 7. August 2028"><LineIcon name="calendar" /></DetailCard><DetailCard label="Teilnehmende" value="Ministrierende ab 12 Jahren"><LineIcon name="people" /></DetailCard><DetailCard label="Veranstalter" value="BDKJ & BJA im Bistum Mainz"><LineIcon name="cross" /></DetailCard></div>
        </div></section>

        <section id="programm" className="scroll-mt-20 border-y border-[#ded9cf] bg-[#ebe7df]"><div className="mx-auto max-w-[1240px] px-5 py-24 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#8b4a37]">Was uns erwartet</p><h2 className="mt-5 max-w-xl font-display text-[clamp(2.8rem,5vw,4.6rem)] font-light leading-[0.98] tracking-[-0.025em]">Acht Tage, die viele Geschichten schreiben.</h2></div><p className="max-w-[330px] text-[14px] leading-relaxed text-[#6f685e]">Glaube, Geschichte und Gemeinschaft – mit genug Zeit, Rom auch auf eigene Weise zu entdecken.</p></div>
          <div className="mt-14 grid border-t border-[#cbc4b9] sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">{highlights.map(({ number, title, desc }, index) => <article key={title} className={`group border-b border-[#cbc4b9] py-8 sm:px-7 sm:py-10 ${index % 2 === 0 ? 'sm:border-r' : ''} ${index % 3 !== 2 ? 'lg:border-r' : 'lg:border-r-0'} ${index % 2 !== 0 ? 'sm:border-r-0' : ''}`}><div className="flex items-start justify-between gap-6"><span className="text-[11px] font-semibold tracking-[0.14em] text-[#9a9185]">{number}</span><span className="grid h-8 w-8 place-items-center rounded-full border border-[#c8c0b5] text-[#6d655b] transition-[background-color,color,transform] duration-200 group-hover:-rotate-45 group-hover:bg-[#1f1a16] group-hover:text-white"><ArrowIcon /></span></div><h3 className="mt-12 font-display text-[29px] font-light leading-tight">{title}</h3><p className="mt-3 max-w-sm text-[14px] leading-[1.7] text-[#6b635a]">{desc}</p></article>)}</div>
        </div></section>

        <section className="bg-[#9b503b] text-white"><div className="mx-auto grid max-w-[1240px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.9fr] lg:px-10 lg:py-28"><div><p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-white/60">Dabei sein</p><h2 className="mt-5 max-w-xl font-display text-[clamp(2.8rem,5vw,4.5rem)] font-light leading-[0.98] tracking-[-0.025em]">Für alle, die dienen. Und gemeinsam aufbrechen wollen.</h2></div><div className="lg:pt-10"><p className="max-w-xl text-[16px] leading-[1.75] text-white/75">Die Wallfahrt ist offen für aktive Ministrantinnen und Ministranten aus dem Bistum Mainz, die im Sommer 2028 mindestens 12 Jahre alt sind. Gruppenleitungen reisen selbstverständlich mit.</p><div className="mt-8 flex flex-wrap gap-2.5">{['Ab 12 Jahren', 'Bistum Mainz', 'Mit deiner Gruppe', 'Leitungen willkommen'].map(tag => <span key={tag} className="rounded-full border border-white/25 bg-white/10 px-4 py-2 text-[12px] font-medium text-white/90">{tag}</span>)}</div></div></div></section>

        <section id="app" className="scroll-mt-20 border-b border-[#ded9cf]"><div className="mx-auto grid max-w-[1240px] items-center gap-16 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-2 lg:px-10 lg:py-36">
          <div className="relative mx-auto w-full max-w-[490px]"><div className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle,#b9d9cf_0%,#d9d2df_45%,transparent_72%)] opacity-80 blur-2xl" /><div className="relative mx-auto w-[70%] min-w-[250px] rounded-[2.5rem] border-[7px] border-[#201b17] bg-[#fbfaf7] p-3 shadow-[0_30px_80px_rgba(41,33,27,0.2)]"><div className="mx-auto mb-3 h-5 w-20 rounded-full bg-[#201b17]" /><div className="overflow-hidden rounded-[1.8rem] bg-[#efebe4] p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#8a8277]">Guten Morgen</p><p className="mt-1 font-display text-[25px] font-light">Rom wartet.</p></div><span className="grid h-9 w-9 place-items-center rounded-full bg-[#1f1a16] text-[12px] text-white">✞</span></div><div className="mt-6 rounded-2xl bg-[#9b503b] p-4 text-white"><p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/60">Heute · 08:30</p><p className="mt-5 font-display text-[24px] font-light">Gottesdienst im Petersdom</p><p className="mt-2 text-[10px] text-white/65">Treffpunkt · Piazza Pia</p></div><div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-white p-4"><span className="text-[16px]">↗</span><p className="mt-7 text-[10px] font-medium">Meine Gruppe</p></div><div className="rounded-2xl bg-[#dbe6df] p-4"><span className="text-[16px]">◎</span><p className="mt-7 text-[10px] font-medium">Notfallhilfe</p></div></div><div className="mt-3 rounded-2xl bg-white p-4"><div className="flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.12em] text-[#8a8277]"><span>Nächster Termin</span><span>11:00</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#eeeae4]"><div className="h-full w-3/5 rounded-full bg-[#1f1a16]" /></div></div></div></div></div>
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#8b4a37]">Die Wallfahrts-App</p><h2 className="mt-5 max-w-xl font-display text-[clamp(2.8rem,5vw,4.6rem)] font-light leading-[0.98] tracking-[-0.025em]">Alles Wichtige. Direkt in deiner Hand.</h2><p className="mt-7 max-w-[560px] text-[16px] leading-[1.75] text-[#645d54]">Programmänderungen, Treffpunkte, Gruppeninfos und Hilfe im Notfall: Die offizielle App begleitet dich durch jeden Tag in Rom.</p><ul className="mt-8 grid gap-4 sm:grid-cols-2">{['Tagesprogramm & Termine', 'Gruppeninformationen', 'Notfallkontakte', 'Aktuelle Ankündigungen'].map(item => <li key={item} className="flex items-center gap-3 text-[14px] font-medium text-[#3b342e]"><CheckIcon />{item}</li>)}</ul><p className="mt-9 text-[12px] leading-relaxed text-[#898277]">Für iOS und Android · Verfügbar kurz vor der Wallfahrt</p></div>
        </div></section>

        <section id="faq" className="scroll-mt-20"><div className="mx-auto grid max-w-[1240px] gap-14 px-5 py-24 sm:px-8 sm:py-28 lg:grid-cols-[0.72fr_1.28fr] lg:px-10 lg:py-36"><div><p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-[#8b4a37]">Gut zu wissen</p><h2 className="mt-5 font-display text-[clamp(2.8rem,5vw,4.6rem)] font-light leading-[0.98] tracking-[-0.025em]">Fragen vor der Reise.</h2><p className="mt-6 max-w-sm text-[14px] leading-[1.7] text-[#6f685e]">Die wichtigsten Antworten haben wir hier gesammelt. Weitere Informationen folgen mit dem Start der Anmeldung.</p></div><div className="border-t border-[#cec7bc]">{faqs.map((faq, index) => { const isOpen = openFaq === index; return <div key={faq.q} className="border-b border-[#cec7bc]"><button type="button" onClick={() => setOpenFaq(isOpen ? null : index)} className="flex w-full items-center justify-between gap-5 py-6 text-left sm:py-7" aria-expanded={isOpen} aria-controls={`faq-answer-${index}`}><span className="text-[15px] font-medium leading-snug text-[#2c2621] sm:text-[16px]">{faq.q}</span><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#c8c0b5] text-[#6d655b] transition-transform duration-200 ${isOpen ? 'rotate-45 bg-[#1f1a16] text-white' : ''}`} aria-hidden="true">+</span></button><div id={`faq-answer-${index}`} className={`grid transition-[grid-template-rows,opacity] duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}><div className="overflow-hidden"><p className="max-w-[650px] pb-7 pr-12 text-[14px] leading-[1.75] text-[#6b635a]">{faq.a}</p></div></div></div> })}</div></div></section>

        <section className="px-5 pb-5 sm:px-8 sm:pb-8 lg:px-10"><div className="relative mx-auto max-w-[1160px] overflow-hidden rounded-[2rem] bg-[#1d1916] px-6 py-16 text-center text-white sm:px-10 sm:py-20"><div className="landing-orb landing-orb-rose absolute -left-24 -top-32 h-80 w-80 rounded-full opacity-30" /><div className="landing-orb landing-orb-mint absolute -bottom-40 -right-20 h-96 w-96 rounded-full opacity-20" /><div className="relative mx-auto max-w-3xl"><p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-white/45">Romwallfahrt 2028</p><h2 className="mt-5 font-display text-[clamp(2.8rem,6vw,5rem)] font-light leading-[0.98] tracking-[-0.025em]">Bereit für deinen Weg nach Rom?</h2><p className="mx-auto mt-6 max-w-xl text-[15px] leading-relaxed text-white/60">Die Anmeldung startet Anfang 2027. Alle Informationen erhältst du rechtzeitig über deine Pfarrei und das Bistum Mainz.</p><a href="mailto:bdkj-bja@bistum-mainz.de" className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-[14px] font-medium text-[#1d1916] transition-[background-color,transform] hover:bg-[#eeeae3] active:scale-[0.97]">Kontakt aufnehmen <ArrowIcon /></a></div></div></section>
      </main>

      <footer className="bg-[#f5f2ec] px-5 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] pt-14 sm:px-8 sm:pt-16 lg:px-10"><div className="mx-auto max-w-[1240px]"><div className="grid gap-10 border-b border-[#d7d0c5] pb-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_0.8fr]"><div><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#1f1a16] text-[14px] text-white">✞</span><span className="font-display text-[22px] font-light">Rom 2028</span></div><p className="mt-5 max-w-sm text-[13px] leading-[1.7] text-[#716a60]">Die offizielle Website der Ministrantenwallfahrt des Bistums Mainz.</p></div><div><h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#91897e]">Veranstalter</h3><address className="mt-4 not-italic text-[13px] leading-[1.75] text-[#575047]">BDKJ & BJA im Bistum Mainz<br />Am Fort Gonsenheim 54<br />55122 Mainz</address></div><div><h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#91897e]">Kontakt</h3><div className="mt-4 space-y-2 text-[13px] text-[#575047]"><a className="block hover:text-[#17130f]" href="tel:+496131253600">06131 2536-00</a><a className="block hover:text-[#17130f]" href="mailto:bdkj-bja@bistum-mainz.de">bdkj-bja@bistum-mainz.de</a></div></div></div><div className="flex flex-col gap-4 py-7 text-[11px] text-[#898277] sm:flex-row sm:items-center sm:justify-between"><span>© 2028 BDKJ & BJA im Bistum Mainz</span><div className="flex flex-wrap gap-x-5 gap-y-2"><Link to="/datenschutz" className="hover:text-[#17130f]">Datenschutz</Link><Link to="/impressum" className="hover:text-[#17130f]">Impressum</Link><Link to="/login" className="hover:text-[#17130f]">Teambereich</Link></div></div></div></footer>
    </div>
  )
}
