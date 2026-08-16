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
  const isBw16 = definition.id === "bw16-kit";
  const isS3 = definition.id === "esp32-s3-devkit";
  const isEsp8266Oled = definition.id === "esp8266-hw364a-oled";

  if (isEsp8266Oled) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="10" fill="#111516" stroke="#3e4446" strokeWidth="5" />
        <path d="M 26 74 H 74 V 90 H 38 V 106 H 74 V 122 H 38 V 138 H 74" fill="none" stroke="#d7c267" strokeWidth="7" />
        <rect x="76" y="54" width="154" height="136" rx="6" fill="#a5a7a0" stroke="#dedfd8" strokeWidth="5" />
        <text x="153" y="111" textAnchor="middle" fill="#3e4545" fontSize="24" fontWeight="900">WiFi</text>
        <text x="153" y="143" textAnchor="middle" fill="#505858" fontSize="17" fontWeight="800">ESP8266MOD</text>
        <text x="153" y="167" textAnchor="middle" fill="#626968" fontSize="12">HW-364A</text>
        <rect x="250" y="48" width="250" height="170" rx="7" fill="#22282c" stroke="#777d80" strokeWidth="5" />
        <rect x="266" y="64" width="218" height="136" rx="4" fill="#06121b" />
        <text x="375" y="112" textAnchor="middle" fill="#ffe56e" fontSize="21" fontFamily="monospace">ESP8266</text>
        <text x="375" y="146" textAnchor="middle" fill="#73e7ff" fontSize="18" fontFamily="monospace">OLED 128x64</text>
        <text x="375" y="178" textAnchor="middle" fill="#73e7ff" fontSize="13" fontFamily="monospace">SDA 14 / SCL 12</text>
        <rect x={width - 79} y="92" width="82" height="100" rx="9" fill="#c8cdd1" stroke="#71787d" strokeWidth="5" />
        <rect x={width - 68} y="112" width="60" height="57" rx="5" fill="#596165" />
        <circle cx={width - 40} cy="48" r="16" fill="#d0ccc0" stroke="#686d6f" strokeWidth="4" />
        <circle cx={width - 40} cy={height - 48} r="16" fill="#d0ccc0" stroke="#686d6f" strokeWidth="4" />
        <circle cx="30" cy="28" r="17" fill="none" stroke="#d9d8d1" strokeWidth="7" />
        <circle cx="30" cy={height - 28} r="17" fill="none" stroke="#d9d8d1" strokeWidth="7" />
        <text x="36" y="53" fill="#d9dddd" fontSize="14" fontWeight="800">HW-364A</text>
      </svg>
    );
  }

  if (isBw16) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="14" fill="#111516" stroke="#303839" strokeWidth="5" />
        <path d={`M ${width * 0.27} 35 H ${width * 0.73} V 52 H ${width * 0.4} V 68 H ${width * 0.73}`} fill="none" stroke="#d5c891" strokeWidth="6" />
        <rect x={width * 0.22} y="78" width={width * 0.56} height="158" rx="6" fill="#a4a09a" stroke="#dedbd3" strokeWidth="5" />
        <text x={width / 2} y="133" textAnchor="middle" fill="#454948" fontSize="28" fontWeight="800">BW16</text>
        <text x={width / 2} y="164" textAnchor="middle" fill="#616665" fontSize="13" fontFamily="monospace">RTL8720DN</text>
        <rect x={width * 0.31} y={height * 0.55} width={width * 0.38} height="77" rx="6" fill="#202629" stroke="#4d5659" strokeWidth="4" />
        {smallParts.map((part) => (
          <rect key={part} x={width * 0.2 + (part % 5) * width * 0.13} y={height * 0.75 + Math.floor(part / 5) * 26} width="17" height="9" rx="2" fill="#c7b98e" />
        ))}
        <rect x={width * 0.33} y={height - 52} width={width * 0.34} height="55" rx="7" fill="#c6cacf" stroke="#71787d" strokeWidth="5" />
        <circle cx="44" cy={height - 39} r="18" fill="#d3d0c8" stroke="#676d70" strokeWidth="4" />
        <circle cx={width - 44} cy={height - 39} r="18" fill="#d3d0c8" stroke="#676d70" strokeWidth="4" />
      </svg>
    );
  }

  if (isS3) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="9" fill="#11171a" stroke="#303a3e" strokeWidth="5" />
        <path d={`M ${width * 0.2} 30 H ${width * 0.78} V 46 H ${width * 0.34} V 60 H ${width * 0.78}`} fill="none" stroke="#c8b777" strokeWidth="6" />
        <rect x={width * 0.17} y="68" width={width * 0.66} height="165" rx="6" fill="#a8aaa6" stroke="#dedfda" strokeWidth="5" />
        <text x={width / 2} y="125" textAnchor="middle" fill="#3d4445" fontSize="21" fontWeight="800" fontFamily="monospace">ESP32-S3</text>
        <text x={width / 2} y="151" textAnchor="middle" fill="#5d6465" fontSize="12" fontFamily="monospace">WROOM-1</text>
        <rect x={width * 0.3} y={height * 0.49} width={width * 0.4} height={width * 0.4} rx="6" fill="#252b2f" stroke="#59636a" strokeWidth="3" />
        {smallParts.map((part) => (
          <rect key={part} x={width * 0.16 + (part % 5) * width * 0.145} y={height * 0.69 + Math.floor(part / 5) * 26} width="19" height="9" rx="2" fill="#b9aa7c" />
        ))}
        <rect x={width * 0.26} y={height - 58} width={width * 0.48} height="65" rx="7" fill="#c5c9cd" stroke="#70777c" strokeWidth="5" />
        <rect x={width * 0.35} y={height - 48} width={width * 0.3} height="21" rx="4" fill="#343a3e" />
        <rect x="29" y={height - 80} width="38" height="29" rx="5" fill="#22282b" stroke="#70777c" strokeWidth="3" />
        <rect x={width - 67} y={height - 80} width="38" height="29" rx="5" fill="#22282b" stroke="#70777c" strokeWidth="3" />
        <text x="48" y={height - 60} textAnchor="middle" fill="#d9dfdf" fontSize="9">RST</text>
        <text x={width - 48} y={height - 60} textAnchor="middle" fill="#d9dfdf" fontSize="8">BOOT</text>
      </svg>
    );
  }

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
  const isCc1101 = definition.id === "cc1101-v2-sma";

  if (isCc1101) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="6" fill="#17609a" stroke="#65a7d2" strokeWidth="5" />
        <g fill="#15191a" stroke="#d2a23e" strokeWidth="3">
          {[36.9, 62.3, 87.7, 113.1].flatMap((y, row) => [
            <circle key={`a-${row}`} cx="13" cy={y} r="8" />,
            <circle key={`b-${row}`} cx="38.4" cy={y} r="8" />,
          ])}
        </g>
        <rect x="78" y="31" width="72" height="72" rx="5" fill="#22272a" stroke="#101315" strokeWidth="4" />
        {smallParts.slice(0, 7).map((part) => (
          <rect key={part} x={66 + part * 24} y="112" width="15" height="8" rx="2" fill="#d4c395" />
        ))}
        <circle cx={width - 77} cy="40" r="22" fill="none" stroke="#d8be70" strokeWidth="7" />
        <rect x={width - 52} y="36" width="55" height="78" rx="8" fill="#d5ad4c" stroke="#806326" strokeWidth="5" />
        <circle cx={width - 14} cy="75" r="12" fill="#332a1e" />
        <text x="142" y="25" textAnchor="middle" fill="#e8f2f7" fontSize="14" fontWeight="800">CC1101 433M</text>
      </svg>
    );
  }
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

function DisplayArtwork({ definition }: Props) {
  const width = definition.widthMm * 10;
  const height = definition.heightMm * 10;
  const isOled = definition.id === "ssd1306-oled-096";
  const isSt7735 = definition.id === "st7735-tft-18";
  const isIli9488 = definition.id === "ili9488-tft-35";
  const isCyberdeckSt7789 = definition.id === "st7789-tft-28-cyberdeck";

  if (isCyberdeckSt7789) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="8" fill="#b9252b" stroke="#f16f73" strokeWidth="5" />
        <rect x="39" y="73" width={width - 78} height={height - 151} rx="7" fill="#dedede" stroke="#f5f5f2" strokeWidth="7" />
        <rect x="58" y="91" width={width - 116} height={height - 201} rx="4" fill="#080b0d" stroke="#333b40" strokeWidth="5" />
        <defs>
          <linearGradient id="ili9341-screen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#21395f" />
            <stop offset="0.55" stopColor="#101827" />
            <stop offset="1" stopColor="#8d2854" />
          </linearGradient>
        </defs>
        <rect x="68" y="101" width={width - 136} height={height - 221} rx="3" fill="url(#ili9341-screen)" />
        {[30, width - 30].flatMap((x) => [30, height - 30].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="12" fill="none" stroke="#f1d5a0" strokeWidth="6" />
        )))}
        <text x={width / 2} y={height - 55} textAnchor="middle" fill="#fff3e8" fontSize="18" fontWeight="900">2.8 TFT 240x320</text>
        <text x={width / 2} y={height - 31} textAnchor="middle" fill="#ffd6d6" fontSize="12" fontFamily="monospace">ILI9341 · SPI · TOUCH · microSD</text>
      </svg>
    );
  }
  const screenInsetX = isOled ? width * 0.09 : width * 0.08;
  const screenInsetTop = isOled ? height * 0.2 : height * 0.07;
  const screenHeight = isOled ? height * 0.65 : height * 0.78;

  return (
    <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill={isOled ? "#176b9e" : "#b7272b"} stroke={isOled ? "#62b9e8" : "#f56b6e"} strokeWidth="5" />
      <rect x={screenInsetX} y={screenInsetTop} width={width - screenInsetX * 2} height={screenHeight} rx="5" fill="#0c1115" stroke="#555d63" strokeWidth="5" />
      <defs>
        <linearGradient id={`screen-${definition.id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={isOled ? "#132d3f" : "#253f64"} />
          <stop offset="0.52" stopColor={isOled ? "#07131b" : "#131d2d"} />
          <stop offset="1" stopColor={isOled ? "#0d6b8b" : "#9c315e"} />
        </linearGradient>
      </defs>
      <rect x={screenInsetX + 8} y={screenInsetTop + 8} width={width - screenInsetX * 2 - 16} height={screenHeight - 16} rx="3" fill={`url(#screen-${definition.id})`} />
      {!isOled && <>
        <circle cx="30" cy="30" r="12" fill="none" stroke="#f1d6a3" strokeWidth="6" />
        <circle cx={width - 30} cy="30" r="12" fill="none" stroke="#f1d6a3" strokeWidth="6" />
        <circle cx="30" cy={height - 30} r="12" fill="none" stroke="#f1d6a3" strokeWidth="6" />
        <circle cx={width - 30} cy={height - 30} r="12" fill="none" stroke="#f1d6a3" strokeWidth="6" />
      </>}
      {isOled && <>
        <circle cx="25" cy="23" r="10" fill="none" stroke="#d7e1e1" strokeWidth="5" />
        <circle cx={width - 25} cy="23" r="10" fill="none" stroke="#d7e1e1" strokeWidth="5" />
        <circle cx="25" cy={height - 23} r="10" fill="none" stroke="#d7e1e1" strokeWidth="5" />
        <circle cx={width - 25} cy={height - 23} r="10" fill="none" stroke="#d7e1e1" strokeWidth="5" />
        <text x={width / 2} y="19" textAnchor="middle" fill="#eaf5f7" fontSize="11" fontWeight="800">GND  VCC  SCL  SDA</text>
      </>}
      {isSt7735 && <>
        <rect x="9" y={height * 0.32} width="29" height="84" rx="4" fill="#822124" stroke="#f6a2a0" strokeWidth="3" />
        <text x="23" y={height * 0.57} textAnchor="middle" fill="#fff1e8" fontSize="9" fontWeight="800" transform={`rotate(-90 23 ${height * 0.57})`}>microSD</text>
        <text x={width - 23} y={height * 0.55} textAnchor="middle" fill="#fff1e8" fontSize="10" fontWeight="800" transform={`rotate(90 ${width - 23} ${height * 0.55})`}>VCC GND CS RST A0 SDA SCK LED</text>
      </>}
      <text x={width / 2} y={isIli9488 ? height * 0.91 : height * 0.94} textAnchor="middle" fill="#eef4f7" fontSize={isIli9488 ? "19" : "14"} fontWeight="800">{definition.shortName}</text>
    </svg>
  );
}

function InterfaceArtwork({ definition }: Props) {
  const width = definition.widthMm * 10;
  const height = definition.heightMm * 10;
  const isMicroSd = definition.id === "microsd-spi-adapter";
  const isGps = definition.id === "neo6m-gps";

  if (isMicroSd) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="#176daf" stroke="#64a9d8" strokeWidth="5" />
        <rect x="38" y="35" width="230" height={height - 70} rx="8" fill="#bfc5c8" stroke="#70797e" strokeWidth="6" />
        <path d={`M 45 52 H 249 V ${height - 52} H 45 Z`} fill="#d8dcdd" opacity="0.55" />
        <rect x="284" y="48" width="58" height="82" rx="5" fill="#22282b" />
        <rect x="296" y="151" width="52" height="41" rx="4" fill="#262c30" />
        <rect x="292" y={height - 57} width="62" height="35" rx="4" fill="#3e464a" />
        <text x="162" y={height - 25} textAnchor="middle" fill="#edf7fb" fontSize="18" fontWeight="900">MicroSD Card Adapter</text>
        <text x={width - 33} y={height / 2} textAnchor="middle" fill="#eef7fb" fontSize="11" fontWeight="800" transform={`rotate(90 ${width - 33} ${height / 2})`}>CS SCK MOSI MISO VCC GND</text>
      </svg>
    );
  }

  if (isGps) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width="350" height={height - 6} rx="8" fill="#1c70b2" stroke="#66add9" strokeWidth="5" />
        <rect x="98" y="58" width="168" height="128" rx="8" fill="#c5c7c3" stroke="#f0f0e9" strokeWidth="5" />
        <text x="182" y="104" textAnchor="middle" fill="#343a3c" fontSize="19" fontWeight="900">u-blox</text>
        <text x="182" y="137" textAnchor="middle" fill="#535a5b" fontSize="16" fontWeight="800">NEO-6M</text>
        <text x="182" y="165" textAnchor="middle" fill="#666d6e" fontSize="12">GY-GPS6MV2</text>
        <circle cx="312" cy="53" r="17" fill="#d4b85f" stroke="#755c22" strokeWidth="5" />
        <path d="M 326 54 C 381 35, 382 137, 411 137" fill="none" stroke="#1b1d1f" strokeWidth="10" />
        <rect x="405" y="35" width="165" height="165" rx="14" fill="#b98262" stroke="#795541" strokeWidth="6" />
        <rect x="417" y="47" width="141" height="141" rx="8" fill="#e5d9c7" stroke="#c2ae94" strokeWidth="4" />
        <circle cx="487" cy="117" r="10" fill="#888074" />
        <text x="175" y={height - 27} textAnchor="middle" fill="#eef7fb" fontSize="16" fontWeight="900">GPS NEO-6M</text>
      </svg>
    );
  }

  return (
    <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <rect x="3" y="3" width={width - 6} height={height - 6} rx="34" fill="#f0f0ec" stroke="#c6c7c3" strokeWidth="5" />
      <circle cx={width * 0.28} cy={height * 0.67} r="28" fill="none" stroke="#b7b9b7" strokeWidth="6" />
      <circle cx={width * 0.72} cy={height * 0.67} r="28" fill="none" stroke="#b7b9b7" strokeWidth="6" />
      <circle cx={width / 2} cy={height * 0.67} r="13" fill="#a7a9a6" stroke="#747875" strokeWidth="4" />
      <text x={width / 2} y="58" textAnchor="middle" fill="#424446" fontSize="22" fontWeight="900">IR T / R</text>
      <text x={width / 2} y="86" textAnchor="middle" fill="#66696a" fontSize="14" fontWeight="800">TRANSMISOR + RECEPTOR</text>
      <g fontSize="15" fontWeight="900" textAnchor="middle">
        <rect x={width / 2 - 82} y="97" width="41" height="30" fill="#f6f6f2" /><text x={width / 2 - 61.5} y="118" fill="#25282a">IN</text>
        <rect x={width / 2 - 41} y="97" width="41" height="30" fill="#f0bd25" /><text x={width / 2 - 20.5} y="118" fill="#402f07">OUT</text>
        <rect x={width / 2} y="97" width="41" height="30" fill="#df3037" /><text x={width / 2 + 20.5} y="118" fill="#fff">5V</text>
        <rect x={width / 2 + 41} y="97" width="41" height="30" fill="#3a3d40" /><text x={width / 2 + 61.5} y="118" fill="#fff">GND</text>
      </g>
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
  const isBatteryDivider = definition.id === "battery-divider-22k-1k";

  if (isBatteryDivider) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="#17342c" stroke="#e0a930" strokeWidth="5" />
        <path d={`M 12 ${height / 2} H 34 M ${width - 34} ${height / 2} H ${width - 12} M ${width / 2} ${height / 2} V ${height - 10}`} fill="none" stroke="#d9c993" strokeWidth="5" />
        <rect x="34" y={height / 2 - 13} width="58" height="26" rx="7" fill="#d9c38f" stroke="#745d2f" strokeWidth="4" />
        <g strokeWidth="5">
          <path d={`M 49 ${height / 2 - 11} V ${height / 2 + 11}`} stroke="#d63636" />
          <path d={`M 60 ${height / 2 - 11} V ${height / 2 + 11}`} stroke="#d63636" />
          <path d={`M 72 ${height / 2 - 11} V ${height / 2 + 11}`} stroke="#1b1d1f" />
        </g>
        <rect x={width - 92} y={height / 2 - 13} width="58" height="26" rx="7" fill="#d9c38f" stroke="#745d2f" strokeWidth="4" />
        <g strokeWidth="5">
          <path d={`M ${width - 77} ${height / 2 - 11} V ${height / 2 + 11}`} stroke="#6f3f1f" />
          <path d={`M ${width - 66} ${height / 2 - 11} V ${height / 2 + 11}`} stroke="#1b1d1f" />
          <path d={`M ${width - 54} ${height / 2 - 11} V ${height / 2 + 11}`} stroke="#d63636" />
        </g>
        <text x="63" y="25" textAnchor="middle" fill="#f6e7bb" fontSize="13" fontWeight="900">2.2k</text>
        <text x={width - 63} y="25" textAnchor="middle" fill="#f6e7bb" fontSize="13" fontWeight="900">1k</text>
        <text x={width / 2} y={height - 12} textAnchor="middle" fill="#ffd65d" fontSize="13" fontWeight="900">ADC</text>
      </svg>
    );
  }

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
  const isEncoder = definition.id === "ky040-encoder";
  const isBuzzer = definition.id === "buzzer-2pin";

  if (isEncoder) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="#151719" stroke="#50575a" strokeWidth="5" />
        <circle cx="113" cy="92" r="59" fill="#b5b9b8" stroke="#606668" strokeWidth="7" />
        <rect x="84" y="-18" width="58" height="94" rx="25" fill="#7f8586" stroke="#474d4e" strokeWidth="6" />
        <path d="M 113 -15 V 67" stroke="#c7cac9" strokeWidth="5" opacity="0.48" />
        <rect x="61" y="53" width="104" height="79" rx="7" fill="#aeb2b1" stroke="#5c6264" strokeWidth="6" />
        <circle cx="113" cy="92" r="35" fill="#777d7f" />
        <text x={width - 32} y={height / 2} textAnchor="middle" fill="#eef2f2" fontSize="12" fontWeight="900" transform={`rotate(90 ${width - 32} ${height / 2})`}>CLK DT SW + GND</text>
        <text x="78" y={height - 18} textAnchor="middle" fill="#e9eeee" fontSize="14" fontWeight="900">KY-040</text>
      </svg>
    );
  }

  if (isBuzzer) {
    return (
      <svg className="component-artwork" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <circle cx={width / 2} cy={height / 2} r={width * 0.46} fill="#151718" stroke="#4f5557" strokeWidth="5" />
        <circle cx={width / 2} cy={height / 2} r={width * 0.13} fill="#050606" />
        <text x={width * 0.28} y={height * 0.39} textAnchor="middle" fill="#d7dddd" fontSize="18" fontWeight="900">+</text>
        <path d={`M ${width * 0.2} ${height * 0.7} Q ${width / 2} ${height * 0.8} ${width * 0.8} ${height * 0.7}`} fill="none" stroke="#34393b" strokeWidth="4" />
      </svg>
    );
  }

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

  if (definition.id === "st7789-tft-28-cyberdeck") {
    return (
      <svg className="component-artwork component-artwork--bottom" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="8" fill="#b9252b" stroke="#f16f73" strokeWidth="5" />
        <rect x={width * 0.47} y={height * 0.24} width={width * 0.43} height={height * 0.39} rx="8" fill="#bfc3c4" stroke="#70777b" strokeWidth="6" />
        <path d={`M ${width * 0.5} ${height * 0.27} H ${width * 0.87} V ${height * 0.59} H ${width * 0.5}`} fill="#d8dbda" opacity="0.48" />
        <rect x="49" y="188" width="77" height="115" rx="6" fill="#c7c9c5" stroke="#737a7c" strokeWidth="5" />
        {smallParts.slice(0, 8).map((part) => (
          <rect key={part} x={53 + (part % 2) * 87} y={352 + Math.floor(part / 2) * 43} width="29" height="14" rx="2" fill="#d6c99d" />
        ))}
        <text x="150" y="78" fill="#fff0e8" fontSize="22" fontWeight="900">2.8 TFT 240x320</text>
        <text x="150" y="107" fill="#ffd4d4" fontSize="14" fontFamily="monospace">ILI9341 · TOUCH · SD</text>
        <text x={width / 2} y={height - 48} textAnchor="middle" fill="#fff1e8" fontSize="12" fontWeight="800">T_IRQ T_DO T_DIN T_CS T_CLK MISO LED SCK MOSI DC RESET CS GND VCC</text>
      </svg>
    );
  }

  if (definition.id === "microsd-spi-adapter") {
    return (
      <svg className="component-artwork component-artwork--bottom" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="#176daf" stroke="#64a9d8" strokeWidth="5" />
        <g fill="none" stroke="#5ca0c9" strokeWidth="3" opacity="0.7">
          {[0, 1, 2, 3, 4, 5].map((index) => <path key={index} d={`M ${width - 18} ${56 + index * 25.4} C 310 ${56 + index * 25.4}, 258 ${38 + index * 27}, 173 ${56 + index * 20}`} />)}
        </g>
        <text x={width / 2} y={height / 2 - 10} textAnchor="middle" fill="#eef7fb" fontSize="22" fontWeight="900">MicroSD Card Adapter</text>
        <text x={width / 2} y={height / 2 + 22} textAnchor="middle" fill="#cce9f7" fontSize="14">CS · SCK · MOSI · MISO · VCC · GND</text>
      </svg>
    );
  }

  if (definition.id === "neo6m-gps") {
    return (
      <svg className="component-artwork component-artwork--bottom" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width="350" height={height - 6} rx="8" fill="#176cae" stroke="#64a9d8" strokeWidth="5" />
        {[55, 295].flatMap((x) => [48, height - 48].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="16" fill="none" stroke="#d9e1df" strokeWidth="6" />))}
        <path d="M 325 53 C 380 35, 381 137, 411 137" fill="none" stroke="#1b1d1f" strokeWidth="10" />
        <rect x="405" y="35" width="165" height="165" rx="14" fill="#969a95" stroke="#666b68" strokeWidth="6" />
        <text x="175" y="120" textAnchor="middle" fill="#eef7fb" fontSize="20" fontWeight="900">GY-GPS6MV2</text>
        <text x="175" y="153" textAnchor="middle" fill="#cce9f7" fontSize="14">GND · TX · RX · VCC</text>
      </svg>
    );
  }

  if (definition.id === "ky040-encoder") {
    return (
      <svg className="component-artwork component-artwork--bottom" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="7" fill="#151719" stroke="#50575a" strokeWidth="5" />
        {[70, 112, 154].map((x, index) => <rect key={x} x={x} y="92" width="25" height="12" rx="2" fill="#d7c99a" stroke="#4a4f50" strokeWidth="2" />)}
        <g fill="none" stroke="#a97745" strokeWidth="3" opacity="0.52">
          <path d="M 82 98 L 207 42" /><path d="M 124 98 L 207 68" /><path d="M 166 98 L 207 94" />
        </g>
        <text x="118" y="42" textAnchor="middle" fill="#eef2f2" fontSize="15" fontWeight="900">KY-040</text>
        <text x={width - 30} y={height / 2} textAnchor="middle" fill="#eef2f2" fontSize="12" fontWeight="900" transform={`rotate(90 ${width - 30} ${height / 2})`}>CLK DT SW + GND</text>
      </svg>
    );
  }

  if (definition.id === "buzzer-2pin") {
    return (
      <svg className="component-artwork component-artwork--bottom" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <circle cx={width / 2} cy={height / 2} r={width * 0.46} fill="#181a1b" stroke="#555b5d" strokeWidth="5" />
        <circle cx={width * 0.29} cy={height * 0.72} r="9" fill="#c8ad66" /><circle cx={width * 0.71} cy={height * 0.72} r="9" fill="#c8ad66" />
        <text x={width * 0.29} y={height * 0.42} textAnchor="middle" fill="#edf1ef" fontSize="16" fontWeight="900">+</text>
      </svg>
    );
  }

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
  if (definition.category === "display") return <DisplayArtwork definition={definition} />;
  if (definition.category === "interface") return <InterfaceArtwork definition={definition} />;
  if (definition.category === "power") return <PowerArtwork definition={definition} />;
  return <ControlArtwork definition={definition} />;
}
