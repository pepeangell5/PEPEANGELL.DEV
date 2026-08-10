import type { HardwareComponentDefinition } from "./catalog";

type Props = {
  definition: HardwareComponentDefinition;
  face?: "bottom" | "top";
};

const smallParts = Array.from({ length: 10 }, (_, index) => index);

function Esp32Artwork({ definition }: Props) {
  const width = definition.widthMm * 10;
  const height = definition.heightMm * 10;
  const isU = definition.id === "esp32-devkit-u";
  const isC3 = definition.id === "esp32-c3-supermini";

  if (isC3) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="8" fill="#11171a" stroke="#27343a" strokeWidth="5" />
        <rect x={width * 0.24} y="-3" width={width * 0.52} height="42" rx="7" fill="#c7cbd0" stroke="#71777d" strokeWidth="4" />
        <rect x={width * 0.31} y="2" width={width * 0.38} height="22" rx="4" fill="#31383d" />
        <rect x={width * 0.28} y={height * 0.33} width={width * 0.44} height={width * 0.44} rx="5" fill="#252b2f" stroke="#69737a" strokeWidth="2" />
        <text x={width / 2} y={height * 0.46} textAnchor="middle" fill="#aab4ba" fontSize="12" fontFamily="monospace">ESP32-C3</text>
        <circle cx={width * 0.5} cy={height * 0.72} r="13" fill="#d8d8cf" stroke="#f2f2ec" strokeWidth="3" />
        <rect x={width * 0.38} y={height * 0.84} width={width * 0.24} height="18" rx="4" fill="#e9292f" />
        {smallParts.slice(0, 6).map((part) => (
          <rect key={part} x={16 + (part % 2) * (width - 42)} y={55 + Math.floor(part / 2) * 36} width="11" height="20" rx="2" fill="#b8aa86" />
        ))}
      </svg>
    );
  }

  return (
    <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx="8" fill="#10171a" stroke="#27343a" strokeWidth="5" />
      {isU ? (
        <>
          <circle cx={width * 0.78} cy="38" r="22" fill="#d9c994" stroke="#7e6a34" strokeWidth="5" />
          <circle cx={width * 0.78} cy="38" r="9" fill="#faf6dc" />
        </>
      ) : (
        <path d={`M ${width * 0.18} 28 H ${width * 0.72} V 42 H ${width * 0.3} V 56 H ${width * 0.72}`} fill="none" stroke="#b5a66f" strokeWidth="6" />
      )}
      <rect x={width * 0.18} y="62" width={width * 0.64} height="150" rx="5" fill="#a7a9a5" stroke="#dedfdb" strokeWidth="4" />
      <text x={width / 2} y="126" textAnchor="middle" fill="#454b4c" fontSize="17" fontWeight="700" fontFamily="monospace">ESP32-WROOM</text>
      <text x={width / 2} y="151" textAnchor="middle" fill="#62696a" fontSize="12" fontFamily="monospace">{isU ? "32U" : "32D"}</text>
      <rect x={width * 0.33} y={height * 0.53} width={width * 0.34} height={width * 0.34} rx="5" fill="#252b2f" stroke="#59636a" strokeWidth="3" />
      {smallParts.map((part) => (
        <rect key={part} x={width * 0.17 + (part % 5) * width * 0.14} y={height * 0.69 + Math.floor(part / 5) * 25} width="19" height="9" rx="2" fill="#b5a67c" />
      ))}
      <rect x={width * 0.27} y={height - 55} width={width * 0.46} height="62" rx="7" fill="#c4c8cc" stroke="#70777c" strokeWidth="5" />
      <rect x={width * 0.35} y={height - 45} width={width * 0.3} height="20" rx="4" fill="#343a3e" />
      <rect x="38" y={height - 76} width="39" height="30" rx="5" fill="#22282b" stroke="#70777c" strokeWidth="3" />
      <rect x={width - 77} y={height - 76} width="39" height="30" rx="5" fill="#22282b" stroke="#70777c" strokeWidth="3" />
      <text x="58" y={height - 56} textAnchor="middle" fill="#d9dfdf" fontSize="10">EN</text>
      <text x={width - 58} y={height - 56} textAnchor="middle" fill="#d9dfdf" fontSize="9">BOOT</text>
    </svg>
  );
}

function RadioArtwork({ definition }: Props) {
  const width = definition.widthMm * 10;
  const height = definition.heightMm * 10;
  return (
    <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="#111517" stroke="#303a3d" strokeWidth="5" />
      <rect x="22" y="42" width="48" height="96" rx="4" fill="#171d20" stroke="#727b7e" strokeWidth="3" />
      <g fill="#15191a" stroke="#d2a23e" strokeWidth="3">
        {[51.9, 77.3, 102.7, 128.1].flatMap((y, row) => [
          <circle key={`a-${row}`} cx="25.4" cy={y} r="8" />,
          <circle key={`b-${row}`} cx="50.8" cy={y} r="8" />,
        ])}
      </g>
      <g fill="#1d2326" stroke="#6e7779" strokeWidth="2">
        <rect x="112" y="44" width="66" height="62" rx="5" />
        <rect x="205" y="74" width="46" height="50" rx="4" />
        <rect x="278" y="48" width="64" height="42" rx="4" />
      </g>
      {smallParts.slice(0, 8).map((part) => (
        <rect key={part} x={112 + part * 27} y="126" width="17" height="8" rx="2" fill="#c3b58e" />
      ))}
      <rect x={width - 98} y="49" width="62" height="82" rx="6" fill="#d4b15b" stroke="#846528" strokeWidth="5" />
      <rect x={width - 48} y="31" width="52" height="118" rx="8" fill="#c89f48" stroke="#f0d486" strokeWidth="5" />
      <circle cx={width - 19} cy={height / 2} r="14" fill="#342c1f" />
      <text x="194" y="31" textAnchor="middle" fill="#d1d8d9" fontSize="15" fontFamily="monospace">nRF24 PA+LNA</text>
    </svg>
  );
}

function PowerArtwork({ definition }: Props) {
  const width = definition.widthMm * 10;
  const height = definition.heightMm * 10;
  const isTp4056 = definition.id === "tp4056";
  const isStepUp = definition.id === "step-up";
  const isStepDown = definition.id === "step-down";
  const isLipo = definition.id === "lipo-37";

  if (isTp4056) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="5" fill="#176cb0" stroke="#65a8d4" strokeWidth="5" />
        <rect x={width * 0.18} y="-3" width={width * 0.64} height="52" rx="7" fill="#c8cdd1" stroke="#777f85" strokeWidth="5" />
        <rect x={width * 0.28} y="4" width={width * 0.44} height="24" rx="4" fill="#30373b" />
        <rect x={width * 0.3} y={height * 0.34} width={width * 0.4} height="54" rx="5" fill="#242a2e" />
        <rect x={width * 0.24} y={height * 0.62} width={width * 0.52} height="42" rx="5" fill="#252b2e" />
        {smallParts.slice(0, 8).map((part) => (
          <rect key={part} x={18 + (part % 2) * (width - 51)} y={65 + Math.floor(part / 2) * 42} width="15" height="23" rx="2" fill="#d6cba7" />
        ))}
        <text x={width / 2} y={height - 18} textAnchor="middle" fill="#f4f8fb" fontSize="16" fontWeight="700">4056</text>
      </svg>
    );
  }

  if (isStepUp) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="5" fill="#176db2" stroke="#62a8d7" strokeWidth="5" />
        <circle cx={width * 0.37} cy={height * 0.3} r={width * 0.27} fill="#30363a" stroke="#111517" strokeWidth="5" />
        <text x={width * 0.37} y={height * 0.32} textAnchor="middle" fill="#e7e9e5" fontSize="21" fontWeight="800">220</text>
        <rect x={width * 0.47} y={height * 0.56} width={width * 0.43} height={height * 0.24} rx="5" fill="#1772cf" stroke="#9ac8ee" strokeWidth="4" />
        <circle cx={width * 0.68} cy={height * 0.68} r="14" fill="#c6c8c4" stroke="#666d70" strokeWidth="4" />
        <rect x={width * 0.17} y={height * 0.58} width="36" height="52" rx="4" fill="#242a2d" />
        <text x={width / 2} y={height - 18} textAnchor="middle" fill="#f3f8fb" fontSize="14" fontWeight="700">STEP-UP</text>
      </svg>
    );
  }

  if (isStepDown) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <linearGradient id="stepdown-board" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#197dcc" />
            <stop offset="1" stopColor="#094c8d" />
          </linearGradient>
          <linearGradient id="stepdown-metal" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#747d83" />
            <stop offset="0.48" stopColor="#eef1ed" />
            <stop offset="1" stopColor="#666e74" />
          </linearGradient>
        </defs>
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="url(#stepdown-board)" stroke="#62b9ed" strokeWidth="5" />
        <g fill="#d8b354" stroke="#f8dda0" strokeWidth="3">
          <circle cx="16.1" cy="37.2" r="10" /><circle cx={width - 16.1} cy="37.2" r="10" />
          <circle cx="16.1" cy={height - 37.2} r="10" /><circle cx={width - 16.1} cy={height - 37.2} r="10" />
        </g>
        <circle cx={width * 0.5} cy={height * 0.31} r={width * 0.28} fill="#252a2d" stroke="#0f1214" strokeWidth="7" />
        <text x={width * 0.5} y={height * 0.325} textAnchor="middle" fill="#e8e5d8" fontSize="26" fontWeight="800">220</text>
        <rect x={width * 0.54} y={height * 0.51} width={width * 0.34} height={height * 0.2} rx="7" fill="#176fd0" stroke="#a3d1f4" strokeWidth="5" />
        <circle cx={width * 0.71} cy={height * 0.61} r="17" fill="url(#stepdown-metal)" stroke="#5f676d" strokeWidth="4" />
        <path d={`M ${width * 0.63} ${height * 0.61} H ${width * 0.79}`} stroke="#525b60" strokeWidth="4" />
        <rect x={width * 0.13} y={height * 0.52} width={width * 0.29} height={height * 0.15} rx="5" fill="#24292c" stroke="#111516" strokeWidth="4" />
        <rect x={width * 0.15} y={height * 0.73} width={width * 0.22} height={height * 0.12} rx="5" fill="#252a2d" />
        <rect x={width * 0.48} y={height * 0.76} width={width * 0.34} height={height * 0.08} rx="4" fill="url(#stepdown-metal)" />
        {smallParts.slice(0, 6).map((part) => (
          <rect key={part} x={24 + (part % 2) * (width - 61)} y={90 + Math.floor(part / 2) * 52} width="18" height="27" rx="2" fill="#d6c496" />
        ))}
        <text x={width / 2} y={height - 17} textAnchor="middle" fill="#e8f6ff" fontSize="14" fontWeight="800">STEP-DOWN</text>
      </svg>
    );
  }

  if (isLipo) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <defs>
          <linearGradient id="lipo-pouch" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#aeb1b3" />
            <stop offset="0.18" stopColor="#f4f5f2" />
            <stop offset="0.72" stopColor="#d3d6d6" />
            <stop offset="1" stopColor="#8f9497" />
          </linearGradient>
          <linearGradient id="lipo-tape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f7c62f" />
            <stop offset="1" stopColor="#bd7d05" />
          </linearGradient>
        </defs>
        <rect x="12" y="35" width={width - 58} height={height - 55} rx="8" fill="url(#lipo-pouch)" stroke="#7f8587" strokeWidth="4" />
        <path d={`M 10 54 Q ${width * 0.42} 28 ${width - 48} 51 V 88 Q ${width * 0.42} 68 10 88 Z`} fill="url(#lipo-tape)" stroke="#9d6708" strokeWidth="3" />
        <path d={`M ${width - 64} 48 C ${width - 18} 40, ${width - 35} 108, ${width - 13} 126`} fill="none" stroke="#202426" strokeWidth="13" />
        <path d={`M ${width - 79} 47 C ${width - 25} 26, ${width - 51} 89, ${width - 13} 104`} fill="none" stroke="#df3138" strokeWidth="13" />
        <rect x={width - 44} y="94" width="38" height="50" rx="5" fill="#f1f0e9" stroke="#777d7f" strokeWidth="4" />
        <rect x={width - 35} y="103" width="8" height="25" rx="2" fill="#c1c5c2" />
        <rect x={width - 20} y="103" width="8" height="25" rx="2" fill="#c1c5c2" />
        <text x={(width - 58) / 2 + 12} y={height * 0.56} textAnchor="middle" fill="#6e7374" fontSize="22" fontWeight="800">LiPo 3.7 V</text>
        <text x={(width - 58) / 2 + 12} y={height * 0.63} textAnchor="middle" fill="#8d9293" fontSize="13">1 CELDA</text>
      </svg>
    );
  }

  return (
    <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="#17242a" stroke={definition.accent} strokeWidth="5" />
      <rect x={width * 0.2} y={height * 0.2} width={width * 0.6} height={height * 0.45} rx="7" fill="#293338" />
      <text x={width / 2} y={height * 0.82} textAnchor="middle" fill="#eef5f4" fontSize="14" fontWeight="700">{definition.shortName}</text>
    </svg>
  );
}

function ControlArtwork({ definition }: Props) {
  const width = definition.widthMm * 10;
  const height = definition.heightMm * 10;
  const isButton = definition.id === "push-button";
  return (
    <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx="8" fill="#141719" stroke="#4b5154" strokeWidth="5" />
      {isButton ? (
        <>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.34} fill="#e9e5dc" stroke="#aaa69e" strokeWidth="5" />
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.18} fill="#f8f5ef" />
        </>
      ) : (
        <>
          <rect x={width * 0.14} y={height * 0.08} width={width * 0.72} height={height * 0.76} rx="7" fill="#262b2e" stroke="#070909" strokeWidth="5" />
          <path d={`M ${width * 0.22} ${height * 0.22} H ${width * 0.78} M ${width * 0.22} ${height * 0.69} H ${width * 0.78}`} stroke="#555d61" strokeWidth="4" />
          <rect x={width * 0.25} y={height * 0.16} width={width * 0.5} height={height * 0.38} rx="5" fill="#e0e2df" stroke="#7c8487" strokeWidth="4" />
          <rect x={width * 0.31} y={height * 0.22} width={width * 0.38} height={height * 0.25} rx="4" fill="#737b7e" />
          <rect x={width * 0.21} y={height * 0.82} width={width * 0.17} height={height * 0.17} rx="2" fill="#d2a74d" />
          <rect x={width * 0.62} y={height * 0.82} width={width * 0.17} height={height * 0.17} rx="2" fill="#d2a74d" />
        </>
      )}
    </svg>
  );
}

function BacksideArtwork({ definition }: Props) {
  const width = definition.widthMm * 10;
  const height = definition.heightMm * 10;
  const boardColor = definition.category === "power" ? "#1a5b8c" : "#18342d";

  return (
    <svg className="component-artwork component-artwork--bottom" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill={boardColor} stroke="#8ca39b" strokeWidth="5" />
      <path d={`M ${width * 0.18} ${height * 0.2} L ${width * 0.5} ${height * 0.5} L ${width * 0.82} ${height * 0.2}`} fill="none" stroke="#b8903c" strokeWidth="4" opacity="0.38" />
      <path d={`M ${width * 0.18} ${height * 0.8} L ${width * 0.5} ${height * 0.5} L ${width * 0.82} ${height * 0.8}`} fill="none" stroke="#b8903c" strokeWidth="4" opacity="0.38" />
      <rect x={width * 0.3} y={height * 0.42} width={width * 0.4} height={height * 0.16} rx="5" fill="#d9d4c8" opacity="0.22" />
      <text x={width / 2} y={height * 0.54} textAnchor="middle" fill="#d7e0dc" fontSize="13" fontFamily="monospace" opacity="0.52">REVERSO</text>
    </svg>
  );
}

export default function ComponentArtwork({ definition, face = "top" }: Props) {
  if (face === "bottom") return <BacksideArtwork definition={definition} face={face} />;
  if (definition.category === "mcu") return <Esp32Artwork definition={definition} />;
  if (definition.category === "radio") return <RadioArtwork definition={definition} />;
  if (definition.category === "power") return <PowerArtwork definition={definition} />;
  return <ControlArtwork definition={definition} />;
}
