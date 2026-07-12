# Loom

**Weave your data into insight.**

A personal analytics OS that tracks your key metrics and discovers hidden correlations with smart visualizations.

![Loom](public/loom.png)

## Features

- **Track Daily Metrics** — Mood, sleep, coffee, steps, screen time, and custom metrics
- **Smart Insights** — Pearson correlation analysis between your habits
- **Anomaly Detection** — Get notified when something unusual happens
- **Day-of-Week Patterns** — Discover your best and worst days
- **Trend Analysis** — Moving averages and week-over-week comparisons
- **Streak Tracking** — Build consistency with daily logging streaks
- **Daily Notes** — Add context to your data
- **Weekly/Monthly Summaries** — Period comparisons and completion rates
- **CSV Export/Import** — Your data in spreadsheet format
- **Full Backup/Restore** — Complete JSON backups
- **Health Connect** — Auto-import steps from Android Health Connect
- **Notifications** — Daily reminders and weekly summaries
- **Custom Metrics** — Create any metric you want to track
- **Responsive** — Works on mobile and desktop
- **Private** — All data stays on your device, no accounts required

## Tech Stack

- [Vue 3](https://vuejs.org/) — Reactive UI framework
- [Pinia](https://pinia.vuejs.org/) — State management
- [Vite](https://vitejs.dev/) — Build tool
- [TailwindCSS](https://tailwindcss.com/) — Utility-first CSS
- [ECharts](https://echarts.apache.org/) — Interactive charts
- [Capacitor](https://capacitorjs.com/) — Native mobile support
- [Health Connect](https://developer.android.com/health-and-fitness/guides/health-connect) — Android health data

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/user/loom.git
cd loom

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview
```

### Android

```bash
# Build and sync to Android
npm run build
npx cap sync android

# Open in Android Studio
npx cap open android
```

## Project Structure

```
loom/
├── public/
│   └── loom.png           # App icon
├── src/
│   ├── components/        # Reusable UI components
│   ├── composables/       # Vue composables (database, insights, notifications)
│   ├── data/              # Default metrics configuration
│   ├── router/            # Vue Router configuration
│   ├── stores/            # Pinia state stores
│   ├── utils/             # Utility functions (correlations, formatters)
│   ├── views/             # Page components
│   └── __tests__/         # Unit tests
├── docs/                  # GitHub Pages landing page
├── android/               # Android Capacitor project
└── package.json
```

## Metrics

| Metric | Type | Range | Description |
|--------|------|-------|-------------|
| Mood | Scale | 1-10 | How are you feeling today? |
| Sleep | Time | 0-14 hrs | Hours of sleep |
| Coffee | Count | 0-20 cups | Coffee intake |
| Steps | Number | 0-100k | Daily steps |
| Screen Time | Time | 0-24 hrs | Hours on screens |
| Custom | Any | Configurable | Create your own |

## Data Storage

- **Web**: IndexedDB (browser storage)
- **Android**: SQLite via Capacitor
- **Export**: CSV or JSON backup files

All data is stored locally on your device. No data is sent to any server.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with Vue.js and the amazing Vue ecosystem
- Charts powered by Apache ECharts
- Icons from Lucide
