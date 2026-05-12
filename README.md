# Text2Sheet — Figma Plugin

Export Figma text layers to a CSV file with a single click.

---

## Features

| Feature | Details |
|---|---|
| **Mark layers** | Select any layer(s) in the canvas, click *Mark Selection* |
| **Unmark layers** | Click ✕ on any card in the list |
| **Focus layer** | Click the target icon to scroll the canvas to that layer |
| **Container traversal** | If a marked layer isn't a Text node, all text children are found recursively |
| **Reorder** | Drag cards to set the CSV row order |
| **Persistence** | Marked layers are saved via `clientStorage` and survive plugin restarts |
| **CSV export** | Downloads `text2sheet_YYYY-MM-DD.csv` with Layer Name + Text Content columns |

---

## CSV Output Format

```
Layer Name,Text Content
Button / Label,Sign up
Hero / Headline,"Welcome to our platform"
…
```

- UTF-8 BOM included for Excel compatibility
- Special characters (commas, quotes, newlines) are properly escaped
- Container nodes are **flattened** — each child text node becomes its own row

---

## Project Structure

```
text2sheet/
├── manifest.json          # Figma plugin manifest
├── package.json
├── tsconfig.json
├── webpack.config.js      # Builds both code.js and ui.html (fully inlined)
└── src/
    ├── code.ts            # Plugin sandbox (Figma API access)
    ├── ui.tsx             # React UI entry point
    ├── ui.html            # HTML template
    ├── App.tsx            # Root component
    ├── types/
    │   └── messages.ts    # Shared types: UIToPluginMessage, PluginToUIMessage, MarkedNode
    ├── hooks/
    │   └── usePlugin.ts   # postMessage bridge + state management
    ├── utils/
    │   └── csv.ts         # CSV builder & download trigger
    ├── styles/
    │   └── global.css     # CSS variables, reset, scrollbar
    └── components/
        ├── Header.tsx     # Plugin title bar
        ├── Toolbar.tsx    # Mark Selection button + stats
        ├── NodeList.tsx   # Drag-to-reorder list + empty state
        ├── NodeCard.tsx   # Individual layer card
        ├── Footer.tsx     # Download CSV button
        └── Toast.tsx      # Error / success notifications
```

---

## Setup & Development

### Prerequisites

- Node.js 18+
- Figma desktop app

### Install & Build

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Production build
npm run build
```

### Load in Figma

1. Open Figma Desktop
2. Go to **Plugins → Development → Import plugin from manifest…**
3. Select `manifest.json` from this folder
4. Run via **Plugins → Development → Text2Sheet**

---

## Message Protocol

All communication between the plugin sandbox (`code.ts`) and the UI (`ui.tsx`) uses `postMessage`.

### UI → Plugin

| Message | Payload | Description |
|---|---|---|
| `MARK_SELECTION` | — | Mark currently selected canvas nodes |
| `UNMARK_NODE` | `nodeId: string` | Remove a node from the list |
| `SELECT_NODE` | `nodeId: string` | Focus + zoom to node in canvas |
| `LOAD_MARKED` | — | Load persisted state from clientStorage |
| `REORDER_NODES` | `nodeIds: string[]` | Save new display order |

### Plugin → UI

| Message | Payload | Description |
|---|---|---|
| `MARKED_NODES_UPDATE` | `nodes: MarkedNode[]` | Full updated list |
| `ERROR` | `message: string` | Show error toast |
| `NOTIFY` | `message: string` | Show success toast |

---

## Extending the Plugin

### Add more CSV columns

Edit `src/utils/csv.ts` → `buildCSV()`. The `MarkedNode` type includes `id`, `name`, `nodeType`, and resolved text.

### Add a CLEAR_ALL action

1. Add `{ type: "CLEAR_ALL" }` to `UIToPluginMessage` in `types/messages.ts`
2. Handle in `code.ts`: `await saveIds([]); await loadAndSendMarkedNodes();`
3. Call from `App.tsx` instead of looping `unmarkNode`

### Export as JSON or other formats

Add a new export function in `src/utils/csv.ts` and a new button in `Footer.tsx`.
