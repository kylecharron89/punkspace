# 💀 PUNKSPACE

> **The internet used to be cool. We're bringing it back.**

PUNKSPACE is a digital basement for you and your friends. No algorithms, no ads, no corporate surveillance. Just raw anarchy, real-time chat, and customisable profiles that would make a 2006 MySpace user weep with joy.

## 🤘 FEATURES

- **Real-Time Anarchy Chat**: Multi-room instant messaging with image and GIF support.
- **Message Board**: Post your manifestos, rants, and updates in full Markdown.
- **Customisable Profiles**: Inject your own CSS and HTML. Break the layout. Add blinky text. Make it yours.
- **Top Friends**: Curate your inner circle.
- **Punk of the Day**: A daily spotlight on a random member of the community.
- **PWA Ready**: Install it as a standalone app on your mobile device.

## 🛠️ TECH STACK

- **Frontend**: React 18, Tailwind CSS 4, Motion, Lucide Icons.
- **Backend**: Node.js, Express, Socket.io.
- **Database**: SQLite (via `better-sqlite3`).
- **Auth**: Secure session-based authentication with Bcrypt.

## 🚀 LOCAL SETUP

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/punkspace.git
   cd punkspace
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the engine**:
   ```bash
   npm run dev
   ```
   The app will be screaming at `http://localhost:3000`.

## 🌐 DEPLOYMENT (RENDER.COM)

1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npm start`
5. **Environment Variables**:
   - `NODE_ENV`: `production`
6. **Persistent Disk (CRITICAL)**:
   - Add a Disk in the Render dashboard.
   - **Mount Path**: `/data`
   - This ensures your `punkspace.db` survives redeploys.

## 📜 LICENCE

**UNLICENCE / ANARCHY**
This is free and unencumbered software released into the public domain. Do whatever you want with it. Steal it. Break it. Fix it. Just stay punk.
