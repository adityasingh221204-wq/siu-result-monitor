# SIU Result Monitor

A world-class, premium, production-ready web application built to monitor Symbiosis International University (SIU) exam result portals and alert students the exact second their results are published. Inspired by the clean, high-performance designs of Apple, Linear, Stripe, and Vercel.

---

## 1. Technical Architecture

The application splits browser automation from the web dashboard API layer to ensure high availability, zero serverless function timeouts on Vercel, and instant notifications.

```
SIU Result Portal (University Server)
       ▲
       │ (Fetch & Captures debug screenshot)
       ▼
Local Python Selenium Worker (results.py)
       │
       │ (POSTs JSON Logs & base64 Screenshots)
       ▼
Next.js 16/React 19 App (Vercel Endpoint)
       │
       │ (Persists checks & health latency)
       ▼
Relational Database (SQLite / Postgres)
       ▲
       │ (GET requests / short polling)
       ▼
Client Web Browser (Sound, Confetti, Success overlay, Spotlight)
```

---

## 2. Tech Stack

- **Frontend**: Next.js 16 (App Router, React 19)
- **Styling**: Tailwind CSS v4, Custom glassmorphic styles
- **State Management**: Zustand
- **Data Caching**: TanStack React Query (SWR / short polling every 5s)
- **Animations**: Framer Motion
- **Data Visualizations**: Recharts
- **Database ORM**: Prisma v7 with libSQL adapter
- **Celebration Assets**: canvas-confetti, Custom loop audio mixers

---

## 3. Getting Started

### Local Setup (Next.js Web App)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adityasingh221204-wq/siu-result-monitor.git
   cd siu-result-monitor
   ```

2. **Install npm dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root folder:
   ```env
   # Local SQLite Database file
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize Database and Schema**:
   Prisma v7 uses a centralized `prisma.config.ts` configuration. Generate the client and apply the migrations:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

5. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the landing page and dashboard.

---

### Local Setup (Python Selenium Worker)

The Selenium worker runs locally on your system to perform headless checks on the university server.

1. **Install python dependencies**:
   Ensure you have Python installed, then install Chrome driver manager, selenium, and pygame (for local audio alarms):
   ```bash
   pip install selenium webdriver-manager pygame
   ```

2. **Configure values in `results.py`**:
   Open [results.py](file:///d:/results%20declaired%20original/results.py) and update the config parameters:
   ```python
   URL = "https://siuexam.siu.edu.in/forms/resultview.html"
   PRN_NUMBER = "24070126017" # Your PRN
   CHECK_INTERVAL = 60 # Polling interval in seconds
   API_URL = "http://localhost:3000/api/logs/create" # Endpoint of your Next.js app
   ```

3. **Run the worker**:
   ```bash
   python results.py
   ```
   The script will print progress logs and automatically upload portal status check metrics and debug screenshots to the web app dashboard.

---

## 4. Vercel Production Deployment

To host the web app dashboard on Vercel:

1. Connect your GitHub repository `adityasingh221204-wq/siu-result-monitor` to Vercel.
2. In the Vercel Project Settings, add a PostgreSQL database (e.g. Vercel Postgres or Supabase).
3. Set the `DATABASE_URL` environment variable to your production PostgreSQL connection string.
4. Modify the `datasource` provider inside `prisma/schema.prisma` from `sqlite` to `postgresql` if deploying to PostgreSQL.
5. Deploy. The web app APIs will automatically handle logs received from your running python script.

---

## 5. Development Command Shortcuts

- **Spotlight Command Palette**: Press `Ctrl + K` or `Cmd + K` on any dashboard screen to search pages, toggle theme colors, switch sound settings, or trigger simulated SUCCESS actions.
- **Simulation Mode**: Go to Settings tab or press "Mock Result" in the header to artificially trigger the fullscreen Confetti and audio alarm celebration, making it easy to test notifications instantly.
