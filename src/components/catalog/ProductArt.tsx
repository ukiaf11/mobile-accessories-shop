import { Fragment, memo } from 'react';
import { cn } from '../../lib/cn';

/**
 * Product artwork.
 *
 * The shop has no photography yet, and stock URLs would make the catalog depend on a CDN that
 * can rot. Instead each product declares an art key which is drawn here as inline SVG: crisp at
 * any size, themeable, zero network requests, and it keeps Lighthouse image weight at nothing.
 * Swapping in real photography later means changing `Product.images` and this component only.
 */

type Family = 'phone' | 'sheet' | 'ring' | 'cable' | 'brick' | 'buds' | 'arm' | 'fabric';

interface ArtSpec {
  family: Family;
  /** Base hue in degrees; the gradient is built from it. */
  hue: number;
  /** Optional extras the family understands. */
  detail?: string;
}

const ART: Record<string, ArtSpec> = {
  // Cases
  'case-clear': { family: 'phone', hue: 236, detail: 'clear' },
  'case-rugged': { family: 'phone', hue: 220, detail: 'rugged' },
  'case-silicone': { family: 'phone', hue: 268, detail: 'solid' },
  'case-magsafe': { family: 'phone', hue: 248, detail: 'magsafe' },
  'case-wallet': { family: 'fabric', hue: 28, detail: 'wallet' },
  'case-flip': { family: 'fabric', hue: 14, detail: 'flip' },
  'back-skin': { family: 'sheet', hue: 210, detail: 'skin' },
  // Screen protection
  'glass-standard': { family: 'sheet', hue: 196 },
  'glass-privacy': { family: 'sheet', hue: 222, detail: 'privacy' },
  'glass-matte': { family: 'sheet', hue: 186, detail: 'matte' },
  'glass-hydrogel': { family: 'sheet', hue: 174, detail: 'flex' },
  'lens-ring': { family: 'ring', hue: 200, detail: 'lens' },
  // Audio
  earbuds: { family: 'buds', hue: 272 },
  neckband: { family: 'cable', hue: 280, detail: 'neckband' },
  'wired-earphone': { family: 'cable', hue: 258, detail: 'earphone' },
  speaker: { family: 'brick', hue: 292, detail: 'speaker' },
  // Charging
  cable: { family: 'cable', hue: 38 },
  adapter: { family: 'brick', hue: 32, detail: 'plug' },
  'car-charger': { family: 'brick', hue: 22, detail: 'car' },
  'wireless-pad': { family: 'ring', hue: 44, detail: 'pad' },
  // Power
  'power-bank': { family: 'brick', hue: 152, detail: 'battery' },
  // Holders
  stand: { family: 'arm', hue: 340 },
  'car-mount': { family: 'arm', hue: 348, detail: 'clamp' },
  'ring-holder': { family: 'ring', hue: 330, detail: 'grip' },
  tripod: { family: 'arm', hue: 356, detail: 'tripod' },
  // Tablet
  'tablet-folio': { family: 'phone', hue: 212, detail: 'tablet' },
  sleeve: { family: 'fabric', hue: 204, detail: 'sleeve' },
  stylus: { family: 'cable', hue: 200, detail: 'stylus' },
  // Smart
  'watch-strap': { family: 'fabric', hue: 310, detail: 'strap' },
  tracker: { family: 'ring', hue: 300, detail: 'tag' },
  // Utility
  otg: { family: 'brick', hue: 208, detail: 'dongle' },
  hub: { family: 'brick', hue: 198, detail: 'hub' },
  'card-reader': { family: 'brick', hue: 188, detail: 'card' },
  'sim-tool': { family: 'cable', hue: 210, detail: 'pin' },
  'cleaning-kit': { family: 'brick', hue: 168, detail: 'spray' },
  'hand-fan': { family: 'ring', hue: 190, detail: 'fan' },
  triggers: { family: 'phone', hue: 258, detail: 'triggers' },
};

const FALLBACK: ArtSpec = { family: 'brick', hue: 240 };

/** Gradient id prefix for an art key. Shared by the sprite and every instance. */
function artId(artKey: string | undefined): string {
  return `art-${artKey && ART[artKey] ? artKey : 'fallback'}`;
}

interface Palette {
  light: string;
  mid: string;
  deep: string;
}

function hueRamp(hue: number): Palette {
  return {
    light: `hsl(${hue} 92% 72%)`,
    mid: `hsl(${hue} 78% 58%)`,
    deep: `hsl(${hue} 62% 38%)`,
  };
}

/**
 * Every gradient the artwork system can reference, defined exactly once per page.
 *
 * Mount this once (App.tsx). SVG `url(#id)` references resolve document-wide, so a card
 * anywhere on the page paints from these definitions without carrying its own copy.
 */
export function ArtDefs() {
  const keys = [...Object.keys(ART), 'fallback'];

  return (
    <svg
      aria-hidden
      width="0"
      height="0"
      focusable="false"
      style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
    >
      <defs>
        {/* Hue-independent: one specular highlight for the whole catalog. */}
        <linearGradient id="art-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {keys.map((key) => {
          const { hue } = ART[key] ?? FALLBACK;
          const { light, mid, deep } = hueRamp(hue);
          return (
            <Fragment key={key}>
              <linearGradient id={`art-${key}-bg`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={`hsl(${hue} 90% 96%)`} />
                <stop offset="100%" stopColor={`hsl(${hue} 70% 90%)`} />
              </linearGradient>
              <linearGradient id={`art-${key}-body`} x1="0.1" y1="0" x2="0.9" y2="1">
                <stop offset="0%" stopColor={light} />
                <stop offset="55%" stopColor={mid} />
                <stop offset="100%" stopColor={deep} />
              </linearGradient>
            </Fragment>
          );
        })}
      </defs>
    </svg>
  );
}

interface ProductArtProps {
  artKey: string | undefined;
  /** Announced to screen readers; pass the product name. */
  label: string;
  className?: string;
}

function ProductArtImpl({ artKey, label, className }: ProductArtProps) {
  const spec = (artKey && ART[artKey]) || FALLBACK;
  const { hue } = spec;
  /*
   * Gradients live in one page-level sprite (`ArtDefs`), not in this instance. Each card
   * used to emit its own <defs> with three <linearGradient>s: 828 of the page's 2012 SVG
   * nodes, and because the ids are key-derived, ~half were duplicate ids that could never
   * paint. The ids are unchanged, so every `url(#art-KEY-body)` reference below still
   * resolves — it just resolves to the one definition instead of the 69th copy.
   */
  const uid = artId(artKey);

  const { light, mid, deep } = hueRamp(hue);

  return (
    // An empty label means the artwork is decorative — a nearby text node already
    // names the product — so it is hidden rather than announced as an unnamed image.
    <svg
      viewBox="0 0 200 200"
      {...(label
        ? { role: 'img' as const, 'aria-label': label }
        : { 'aria-hidden': true as const })}
      className={cn('h-full w-full', className)}
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="200" height="200" rx="28" fill={`url(#${uid}-bg)`} />
      <circle cx="152" cy="46" r="58" fill="#ffffff" opacity="0.45" />
      <circle cx="42" cy="168" r="46" fill={mid} opacity="0.16" />

      <g fill={`url(#${uid}-body)`}>{renderFamily(spec, uid, { light, mid, deep })}</g>
    </svg>
  );
}

function renderFamily(spec: ArtSpec, uid: string, palette: Palette) {
  switch (spec.family) {
    case 'phone':
      return renderPhone(spec, uid, palette);
    case 'sheet':
      return renderSheet(spec, uid, palette);
    case 'ring':
      return renderRing(spec, uid, palette);
    case 'cable':
      return renderCable(spec, uid, palette);
    case 'brick':
      return renderBrick(spec, uid, palette);
    case 'buds':
      return renderBuds(spec, uid, palette);
    case 'arm':
      return renderArm(spec, uid, palette);
    case 'fabric':
      return renderFabric(spec, uid, palette);
  }
}

/* ── Phone-shaped: cases, folios, grip accessories ─────────────────────────── */
function renderPhone({ detail }: ArtSpec, uid: string, { deep, light }: Palette) {
  const tablet = detail === 'tablet';
  const x = tablet ? 52 : 62;
  const w = tablet ? 96 : 76;
  const y = tablet ? 34 : 28;
  const h = tablet ? 132 : 144;
  const clear = detail === 'clear';

  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={tablet ? 14 : 20}
        fill={clear ? '#ffffff' : `url(#${uid}-body)`}
        fillOpacity={clear ? 0.62 : 1}
        stroke={deep}
        strokeOpacity={clear ? 0.45 : 0.25}
        strokeWidth={clear ? 3 : 2}
      />
      <rect
        x={x + 8}
        y={y + 10}
        width={w - 16}
        height={h - 24}
        rx={tablet ? 8 : 13}
        fill="#0f172a"
        opacity={clear ? 0.08 : 0.18}
      />
      {/* Camera island */}
      <rect x={x + 12} y={y + 14} width={30} height={30} rx={9} fill="#0f172a" opacity="0.32" />
      <circle cx={x + 21} cy={y + 24} r="5.5" fill={light} opacity="0.9" />
      <circle cx={x + 33} cy={y + 34} r="5.5" fill={light} opacity="0.7" />

      {detail === 'magsafe' && (
        <>
          <circle
            cx={x + w / 2}
            cy={y + h / 2 + 10}
            r="26"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.9"
            strokeWidth="6"
            strokeDasharray="5 7"
          />
          <circle cx={x + w / 2} cy={y + h / 2 + 10} r="9" fill="#ffffff" opacity="0.85" />
        </>
      )}
      {detail === 'rugged' && (
        <>
          {[0, 1, 2, 3].map((corner) => {
            const cx = corner % 2 === 0 ? x + 12 : x + w - 12;
            const cy = corner < 2 ? y + h - 40 : y + h - 14;
            return <circle key={corner} cx={cx} cy={cy} r="7" fill="#ffffff" opacity="0.5" />;
          })}
        </>
      )}
      {detail === 'triggers' && (
        <>
          <rect x={x - 12} y={y + 6} width="20" height="26" rx="7" fill="#0f172a" opacity="0.55" />
          <rect x={x + w - 8} y={y + 6} width="20" height="26" rx="7" fill="#0f172a" opacity="0.55" />
        </>
      )}
      <rect x={x + 6} y={y + 8} width={w * 0.45} height={h * 0.5} rx="14" fill="url(#art-shine)" />
    </>
  );
}

/* ── Flat sheets: tempered glass, films, skins ─────────────────────────────── */
function renderSheet({ detail }: ArtSpec, _uid: string, { deep, mid }: Palette) {
  return (
    <>
      <g transform="rotate(-8 100 100)">
        <rect
          x="58"
          y="34"
          width="84"
          height="132"
          rx="16"
          fill="#ffffff"
          fillOpacity="0.72"
          stroke={deep}
          strokeOpacity="0.35"
          strokeWidth="2.5"
        />
        {detail === 'privacy' && (
          <>
            <rect x="58" y="34" width="42" height="132" rx="16" fill="#0f172a" opacity="0.55" />
            <path d="M100 34v132" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="2" />
          </>
        )}
        {detail === 'matte' && (
          <g opacity="0.35">
            {Array.from({ length: 9 }, (_, i) => (
              <path
                key={i}
                d={`M58 ${44 + i * 14}h84`}
                stroke={mid}
                strokeWidth="2"
                strokeDasharray="3 5"
              />
            ))}
          </g>
        )}
        {detail === 'flex' && (
          <path
            d="M66 150c22-14 46-14 68 0"
            fill="none"
            stroke={mid}
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
        {detail === 'skin' && (
          <g opacity="0.4">
            {Array.from({ length: 6 }, (_, i) => (
              <path key={i} d={`M62 ${50 + i * 20}l76-16`} stroke={mid} strokeWidth="3" />
            ))}
          </g>
        )}
        <circle cx="100" cy="46" r="4" fill={deep} opacity="0.4" />
        <rect x="62" y="38" width="40" height="70" rx="12" fill="url(#art-shine)" />
      </g>
      {/* Peel tab, so it reads as a protector rather than a screen. */}
      <path d="M138 40l22-10-6 22z" fill={mid} opacity="0.75" />
    </>
  );
}

/* ── Circular: lens rings, wireless pads, grips, trackers, fans ────────────── */
function renderRing({ detail }: ArtSpec, uid: string, { deep, light, mid }: Palette) {
  return (
    <>
      <circle cx="100" cy="100" r="56" fill={`url(#${uid}-body)`} />
      <circle cx="100" cy="100" r="56" fill="url(#art-shine)" />
      {detail === 'lens' && (
        <>
          <circle cx="100" cy="100" r="34" fill="#0f172a" opacity="0.45" />
          <circle cx="100" cy="100" r="22" fill={deep} />
          <circle cx="100" cy="100" r="12" fill="#0f172a" opacity="0.75" />
          <circle cx="92" cy="90" r="5" fill="#ffffff" opacity="0.8" />
        </>
      )}
      {detail === 'pad' && (
        <>
          <circle cx="100" cy="100" r="34" fill="#ffffff" opacity="0.35" />
          <path
            d="M104 82l-14 24h12l-4 16 16-24h-12z"
            fill="#ffffff"
            opacity="0.95"
          />
        </>
      )}
      {detail === 'grip' && (
        <>
          <circle cx="100" cy="100" r="34" fill="none" stroke="#ffffff" strokeWidth="10" opacity="0.9" />
          <rect x="86" y="140" width="28" height="18" rx="7" fill={deep} opacity="0.8" />
        </>
      )}
      {detail === 'tag' && (
        <>
          <circle cx="100" cy="100" r="30" fill="#ffffff" opacity="0.4" />
          <circle cx="100" cy="100" r="10" fill="#ffffff" opacity="0.9" />
          <circle cx="100" cy="56" r="9" fill="none" stroke={deep} strokeWidth="5" opacity="0.7" />
        </>
      )}
      {detail === 'fan' && (
        <g opacity="0.92">
          {[0, 120, 240].map((angle) => (
            <path
              key={angle}
              d="M100 100c18-6 30 4 30 18 0-22-12-34-30-34z"
              fill="#ffffff"
              transform={`rotate(${angle} 100 100)`}
            />
          ))}
          <circle cx="100" cy="100" r="9" fill={light} />
          <rect x="92" y="152" width="16" height="30" rx="6" fill={mid} />
        </g>
      )}
    </>
  );
}

/* ── Linear: cables, neckbands, styluses, pins ─────────────────────────────── */
function renderCable({ detail }: ArtSpec, uid: string, { deep, mid }: Palette) {
  if (detail === 'stylus' || detail === 'pin') {
    const long = detail === 'stylus';
    return (
      <g transform="rotate(35 100 100)">
        <rect
          x="92"
          y={long ? 34 : 60}
          width={long ? 18 : 8}
          height={long ? 116 : 90}
          rx={long ? 9 : 4}
          fill={`url(#${uid}-body)`}
        />
        <path
          d={long ? 'M92 150l9 22 9-22z' : 'M96 150l4 16 4-16z'}
          fill={deep}
        />
        <rect x="92" y={long ? 40 : 64} width={long ? 8 : 4} height="52" rx="4" fill="url(#art-shine)" />
      </g>
    );
  }

  const neck = detail === 'neckband';
  return (
    <>
      <path
        d={
          neck
            ? 'M56 76c0 54 88 54 88 0'
            : 'M48 62c40 0 26 76 62 76s22-76 42-76'
        }
        fill="none"
        stroke={`url(#${uid}-body)`}
        strokeWidth={neck ? 16 : 12}
        strokeLinecap="round"
      />
      {neck ? (
        <>
          <circle cx="56" cy="70" r="13" fill={deep} />
          <circle cx="144" cy="70" r="13" fill={deep} />
          <path d="M56 84v34M144 84v34" stroke={mid} strokeWidth="5" strokeLinecap="round" />
          <circle cx="56" cy="124" r="9" fill={mid} />
          <circle cx="144" cy="124" r="9" fill={mid} />
        </>
      ) : (
        <>
          <rect x="38" y="50" width="24" height="26" rx="7" fill={deep} />
          <rect x="140" y="50" width="24" height="26" rx="7" fill={deep} />
          {detail === 'earphone' && (
            <>
              <circle cx="72" cy="150" r="15" fill={mid} />
              <circle cx="128" cy="150" r="15" fill={mid} />
              <circle cx="72" cy="150" r="6" fill="#ffffff" opacity="0.8" />
              <circle cx="128" cy="150" r="6" fill="#ffffff" opacity="0.8" />
            </>
          )}
        </>
      )}
    </>
  );
}

/* ── Blocks: adapters, power banks, hubs, speakers ─────────────────────────── */
function renderBrick({ detail }: ArtSpec, uid: string, { deep, light, mid }: Palette) {
  const tall = detail === 'battery' || detail === 'spray';
  const w = tall ? 84 : 96;
  const h = tall ? 118 : 92;
  const x = (200 - w) / 2;
  const y = (200 - h) / 2 + (detail === 'plug' ? -6 : 0);

  return (
    <>
      <rect x={x} y={y} width={w} height={h} rx="20" fill={`url(#${uid}-body)`} />
      <rect x={x} y={y} width={w * 0.55} height={h * 0.6} rx="18" fill="url(#art-shine)" />

      {detail === 'plug' && (
        <>
          <rect x="86" y={y + h - 4} width="10" height="26" rx="3" fill={deep} />
          <rect x="104" y={y + h - 4} width="10" height="26" rx="3" fill={deep} />
          <rect x={x + 22} y={y + 26} width="24" height="12" rx="6" fill="#0f172a" opacity="0.4" />
        </>
      )}
      {detail === 'battery' && (
        <>
          <rect x={x + 16} y={y + 22} width={w - 32} height="18" rx="9" fill="#0f172a" opacity="0.3" />
          {[0, 1, 2, 3].map((i) => (
            <rect
              key={i}
              x={x + 20 + i * 13}
              y={y + 26}
              width="9"
              height="10"
              rx="3"
              fill={i < 3 ? '#ffffff' : deep}
              opacity={i < 3 ? 0.95 : 0.4}
            />
          ))}
          <rect x={x + 20} y={y + 62} width="20" height="12" rx="4" fill="#0f172a" opacity="0.4" />
          <rect x={x + 46} y={y + 62} width="20" height="12" rx="4" fill="#0f172a" opacity="0.4" />
        </>
      )}
      {detail === 'speaker' && (
        <>
          <circle cx="76" cy="100" r="22" fill="#0f172a" opacity="0.35" />
          <circle cx="124" cy="100" r="22" fill="#0f172a" opacity="0.35" />
          <circle cx="76" cy="100" r="9" fill={light} />
          <circle cx="124" cy="100" r="9" fill={light} />
        </>
      )}
      {detail === 'car' && (
        <>
          <rect x="92" y={y - 22} width="16" height="26" rx="6" fill={deep} />
          <circle cx="100" cy={y + 44} r="10" fill="#0f172a" opacity="0.35" />
          <circle cx="100" cy={y + 70} r="10" fill="#0f172a" opacity="0.35" />
        </>
      )}
      {(detail === 'hub' || detail === 'dongle' || detail === 'card') && (
        <>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={x + 18 + i * 22}
              y={y + h / 2 - 6}
              width="16"
              height="12"
              rx="4"
              fill="#0f172a"
              opacity="0.4"
            />
          ))}
          <rect x={x - 18} y={y + h / 2 - 8} width="24" height="16" rx="5" fill={mid} />
        </>
      )}
      {detail === 'spray' && (
        <>
          <rect x="88" y={y - 20} width="24" height="24" rx="6" fill={deep} />
          <rect x={x + 14} y={y + 40} width={w - 28} height="46" rx="10" fill="#ffffff" opacity="0.35" />
        </>
      )}
    </>
  );
}

/* ── Earbuds + charging case ───────────────────────────────────────────────── */
function renderBuds(_spec: ArtSpec, uid: string, { deep, light }: Palette) {
  return (
    <>
      <rect x="58" y="104" width="84" height="60" rx="22" fill={`url(#${uid}-body)`} />
      <path d="M58 128h84" stroke={deep} strokeWidth="3" opacity="0.4" />
      <rect x="62" y="108" width="46" height="30" rx="16" fill="url(#art-shine)" />
      {[74, 126].map((cx, index) => (
        <g key={cx}>
          <circle cx={cx} cy="62" r="21" fill={`url(#${uid}-body)`} />
          <circle cx={cx} cy="62" r="9" fill="#ffffff" opacity="0.85" />
          <rect
            x={cx - 6}
            y="76"
            width="12"
            height={index === 0 ? 30 : 26}
            rx="6"
            fill={light}
          />
        </g>
      ))}
    </>
  );
}

/* ── Stands, mounts, tripods ───────────────────────────────────────────────── */
function renderArm({ detail }: ArtSpec, uid: string, { deep, mid }: Palette) {
  if (detail === 'tripod') {
    return (
      <>
        <rect x="84" y="34" width="32" height="52" rx="10" fill={`url(#${uid}-body)`} />
        <rect x="94" y="86" width="12" height="40" rx="6" fill={mid} />
        <path
          d="M100 126L60 172M100 126l40 46M100 126v46"
          stroke={`url(#${uid}-body)`}
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="100" cy="126" r="12" fill={deep} />
      </>
    );
  }

  if (detail === 'clamp') {
    return (
      <>
        <rect x="54" y="70" width="14" height="70" rx="7" fill={`url(#${uid}-body)`} />
        <rect x="132" y="70" width="14" height="70" rx="7" fill={`url(#${uid}-body)`} />
        <rect x="68" y="96" width="64" height="16" rx="8" fill={mid} />
        <circle cx="100" cy="104" r="16" fill={deep} />
        <path d="M100 120v34" stroke={mid} strokeWidth="10" strokeLinecap="round" />
        <rect x="76" y="150" width="48" height="16" rx="8" fill={`url(#${uid}-body)`} />
      </>
    );
  }

  return (
    <>
      {/* Folding desk stand seen from the side. */}
      <path
        d="M62 158L118 44"
        stroke={`url(#${uid}-body)`}
        strokeWidth="18"
        strokeLinecap="round"
      />
      <path d="M62 158h84" stroke={mid} strokeWidth="16" strokeLinecap="round" />
      <path d="M118 44l16 40" stroke={deep} strokeWidth="12" strokeLinecap="round" opacity="0.7" />
      <rect
        x="96"
        y="52"
        width="56"
        height="84"
        rx="12"
        fill="#ffffff"
        opacity="0.45"
        transform="rotate(14 124 94)"
      />
    </>
  );
}

/* ── Soft goods: wallets, flips, sleeves, straps ───────────────────────────── */
function renderFabric({ detail }: ArtSpec, uid: string, { deep, mid }: Palette) {
  if (detail === 'strap') {
    return (
      <>
        <path
          d="M74 26c-10 26-10 52 0 78M126 26c10 26 10 52 0 78"
          stroke={`url(#${uid}-body)`}
          strokeWidth="24"
          strokeLinecap="round"
          fill="none"
          transform="translate(0 36)"
        />
        <rect x="66" y="76" width="68" height="56" rx="18" fill={deep} />
        <rect x="74" y="84" width="52" height="40" rx="12" fill="#0f172a" opacity="0.55" />
        <circle cx="100" cy="104" r="9" fill={mid} />
      </>
    );
  }

  if (detail === 'sleeve') {
    return (
      <>
        <rect x="46" y="52" width="108" height="96" rx="18" fill={`url(#${uid}-body)`} />
        <rect x="46" y="52" width="108" height="34" rx="16" fill="#ffffff" opacity="0.28" />
        <path d="M46 118h108" stroke={deep} strokeWidth="4" opacity="0.45" />
        <rect x="70" y="126" width="60" height="8" rx="4" fill="#ffffff" opacity="0.5" />
      </>
    );
  }

  // Wallet / flip cover: open folio with cards.
  return (
    <>
      <path d="M44 48h72v112H44z" fill={`url(#${uid}-body)`} />
      <path d="M116 48h44v112h-44z" fill={deep} opacity="0.55" />
      <rect x="122" y="66" width="32" height="60" rx="8" fill="#0f172a" opacity="0.5" />
      {detail === 'wallet' &&
        [0, 1, 2].map((i) => (
          <rect
            key={i}
            x="54"
            y={70 + i * 24}
            width="52"
            height="18"
            rx="5"
            fill="#ffffff"
            opacity={0.75 - i * 0.15}
          />
        ))}
      {detail === 'flip' && (
        <>
          <rect x="56" y="70" width="48" height="72" rx="10" fill="#ffffff" opacity="0.35" />
          <circle cx="80" cy="152" r="6" fill={mid} />
        </>
      )}
      <path d="M116 48v112" stroke={mid} strokeWidth="3" opacity="0.7" />
      <rect x="46" y="50" width="40" height="56" rx="10" fill="url(#art-shine)" />
    </>
  );
}

export const ProductArt = memo(ProductArtImpl);
