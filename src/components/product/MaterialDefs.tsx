// Shared SVG paint servers for every ProductVisual on the page. Rendered once in the root layout;
// kept in the layout tree (not display:none) because hidden <defs> stop painting in some browsers.

type Stop = [offset: number, color: string];

const LINEAR: Record<string, { stops: Stop[]; vertical?: boolean }> = {
  "mg-brass": {
    stops: [
      [0, "#f1dfae"],
      [0.28, "#d2ae6b"],
      [0.52, "#a07a3b"],
      [0.74, "#dcc084"],
      [1, "#8a6631"],
    ],
  },
  "mg-silver": {
    stops: [
      [0, "#fdfdfd"],
      [0.3, "#d9dadc"],
      [0.55, "#a9acb0"],
      [0.75, "#eeeeef"],
      [1, "#9da0a4"],
    ],
  },
  "mg-steel": {
    stops: [
      [0, "#eceef0"],
      [0.35, "#b7bcc2"],
      [0.55, "#8a9097"],
      [0.78, "#d3d7db"],
      [1, "#7c8288"],
    ],
  },
  "mg-titanium": {
    stops: [
      [0, "#a9acaf"],
      [0.4, "#8b8f93"],
      [0.65, "#6d7175"],
      [0.85, "#94989c"],
      [1, "#62666a"],
    ],
  },
  "mg-leather": {
    stops: [
      [0, "#b0703f"],
      [0.5, "#8d5229"],
      [1, "#6b3a1c"],
    ],
  },
  "mg-oak": {
    stops: [
      [0, "#d8b688"],
      [0.5, "#c39c6a"],
      [1, "#a67d4d"],
    ],
    vertical: true,
  },
  "mg-oak-top": {
    stops: [
      [0, "#e9cfa6"],
      [1, "#cfac7c"],
    ],
    vertical: true,
  },
  "mg-walnut": {
    stops: [
      [0, "#7d573a"],
      [0.55, "#5a3c26"],
      [1, "#3f2919"],
    ],
  },
  "mg-ceramic": {
    stops: [
      [0, "#fbfaf6"],
      [0.6, "#ebe6dc"],
      [1, "#d6cfc2"],
    ],
    vertical: true,
  },
  "mg-sheen": {
    stops: [
      [0, "rgba(255,255,255,0)"],
      [0.45, "rgba(255,255,255,0.42)"],
      [1, "rgba(255,255,255,0)"],
    ],
  },
};

export function MaterialDefs() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        {Object.entries(LINEAR).map(([id, { stops, vertical }]) => (
          <linearGradient key={id} id={id} x1="0" y1="0" x2={vertical ? "0" : "1"} y2="1">
            {stops.map(([offset, color]) => (
              <stop key={offset} offset={offset} stopColor={color} />
            ))}
          </linearGradient>
        ))}
        <radialGradient id="mg-bowl-inner" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#f6f3ec" />
          <stop offset="1" stopColor="#c9c0b0" />
        </radialGradient>
        <filter id="mv-shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>
    </svg>
  );
}
