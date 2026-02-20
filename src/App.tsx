import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, MessageSquare, User, Layout, Skull, Menu, X } from 'lucide-react';
import { io } from 'socket.io-client';
import Auth from './components/Auth';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Board from './components/Board';
import PostDetail from './components/PostDetail';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [punkOfDay, setPunkOfDay] = useState<any>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
        if (data) {
          const socket = io();
          socket.emit('authenticate', data.id);
        }
      });

    fetch('/api/stats/punk-of-the-day')
      .then(res => res.json())
      .then(data => setPunkOfDay(data));

    const fetchOnline = () => {
      fetch('/api/stats/online')
        .then(res => res.json())
        .then(data => setOnlineUsers(data));
    };

    fetchOnline();
    const interval = setInterval(fetchOnline, 30000); // Refresh online list every 30s
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-centre justify-centre font-display text-4xl text-punk-pink animate-pulse">LOADING ANARCHY...</div>;

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Header / Marquee */}
        <div className="bg-punk-pink text-black py-1 overflow-hidden border-b-2 border-white">
          <div className="animate-marquee whitespace-nowrap inline-block">
            WELCOME TO PUNKSPACE - THE ONLY PLACE FOR REAL ANARCHISTS - NO CORPORATE BS - SHARE YOUR SOUL - CUSTOMISE YOUR PROFILE - CHAT IN REAL TIME - WELCOME TO PUNKSPACE - 
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-zinc-900 border-b-2 border-punk-pink p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-centre">
            <Link to="/" className="flex items-centre gap-2 group">
              <Skull className="text-punk-pink group-hover:rotate-12 transition-transform" size={32} />
              <span className="font-display text-3xl text-white group-hover:text-punk-pink transition-colours">PUNKSPACE</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-centre gap-6">
              {user ? (
                <>
                  <Link to="/chat" className="flex items-centre gap-1 hover:text-punk-cyan transition-colours"><MessageSquare size={18} /> CHAT</Link>
                  <Link to="/board" className="flex items-centre gap-1 hover:text-punk-yellow transition-colours"><Layout size={18} /> BOARD</Link>
                  <Link to={`/profile/${user.username}`} className="flex items-centre gap-1 hover:text-punk-green transition-colours"><User size={18} /> MY PROFILE</Link>
                  <button onClick={handleLogout} className="punk-button py-1 text-sm bg-punk-red">LOGOUT</button>
                </>
              ) : (
                <Link to="/auth" className="punk-button py-1">LOGIN / JOIN</Link>
              )}
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden text-punk-pink" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
            </button>
          </div>

          {/* Mobile Nav */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden flex flex-col gap-4 mt-4 pb-4"
              >
                {user ? (
                  <>
                    <Link to="/chat" onClick={() => setIsMenuOpen(false)} className="flex items-centre gap-2 text-xl"><MessageSquare /> CHAT</Link>
                    <Link to="/board" onClick={() => setIsMenuOpen(false)} className="flex items-centre gap-2 text-xl"><Layout /> BOARD</Link>
                    <Link to={`/profile/${user.username}`} onClick={() => setIsMenuOpen(false)} className="flex items-centre gap-2 text-xl"><User /> PROFILE</Link>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="punk-button bg-punk-red">LOGOUT</button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="punk-button text-centre">LOGIN / JOIN</Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="flex-grow max-w-6xl w-full mx-auto p-4">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col items-centre justify-centre py-12 text-centre">
                <motion.h1 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl md:text-8xl mb-6 text-punk-pink glitch"
                  data-text="STAY PUNK."
                >
                  STAY PUNK.
                </motion.h1>
                <p className="text-xl max-w-2xl mb-8 text-zinc-400">
                  The internet used to be cool. We're bringing it back. No algorithms, no ads, just you and your friends in a digital basement.
                </p>
                {!user && (
                  <Link to="/auth" className="punk-button text-2xl px-8 py-4">ENTER THE ANARCHY</Link>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-12">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Link to="/chat" className="punk-card hover:border-punk-cyan transition-colours group">
                      <h2 className="text-3xl text-punk-cyan group-hover:text-white">REAL-TIME CHAT</h2>
                      <p className="text-zinc-500">Instant messaging for the underground.</p>
                    </Link>
                    <Link to="/board" className="punk-card hover:border-punk-yellow transition-colours group">
                      <h2 className="text-3xl text-punk-yellow group-hover:text-white">MESSAGE BOARD</h2>
                      <p className="text-zinc-500">Post your manifestos and rants.</p>
                    </Link>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="punk-card border-punk-green">
                      <h3 className="text-xl text-punk-green mb-2 flex items-centre gap-2"><Skull size={18} /> PUNK OF THE DAY</h3>
                      {punkOfDay ? (
                        <Link to={`/profile/${punkOfDay.username}`} className="flex items-centre gap-3 hover:bg-white/5 p-1 transition-colours">
                          <img 
                            src={punkOfDay.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${punkOfDay.username}`} 
                            className="w-12 h-12 border border-punk-green" 
                            alt="punk" 
                          />
                          <div>
                            <div className="font-bold text-white">{punkOfDay.username}</div>
                            <div className="text-[10px] text-zinc-500 truncate max-w-[150px]">
                              "{punkOfDay.bio || 'STAY PUNK.'}"
                            </div>
                          </div>
                        </Link>
                      ) : (
                        <div className="text-xs text-zinc-600 italic">No punks found in the void.</div>
                      )}
                    </div>
                    
                    <div className="punk-card border-punk-red">
                      <h3 className="text-xl text-punk-red mb-2 flex items-centre gap-2">
                        <div className={`w-2 h-2 bg-punk-red rounded-full ${onlineUsers.length > 0 ? 'animate-ping' : ''}`} /> 
                        ONLINE NOW ({onlineUsers.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {onlineUsers.map(u => (
                          <Link 
                            key={u.id} 
                            to={`/profile/${u.username}`}
                            className="w-8 h-8 border border-zinc-700 overflow-hidden hover:border-punk-cyan transition-colours" 
                            title={u.username}
                          >
                            <img src={u.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${u.username}`} alt={u.username} />
                          </Link>
                        ))}
                        {onlineUsers.length === 0 && (
                          <div className="text-[10px] text-zinc-600 italic">Ghost town...</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth onLogin={setUser} />} />
            <Route path="/chat" element={user ? <Chat user={user} /> : <Navigate to="/auth" />} />
            <Route path="/board" element={<Board user={user} />} />
            <Route path="/board/:id" element={<PostDetail user={user} />} />
            <Route path="/profile/:username" element={<Profile currentUser={user} />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-zinc-900 border-t-2 border-punk-pink p-8 mt-12">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-centre gap-4">
            <div className="text-zinc-500 text-sm">
              &copy; 2006-2026 PUNKSPACE. ALL RIGHTS RESERVED. NO COPYRIGHT. STEAL EVERYTHING.
            </div>
            <div className="flex gap-4 text-punk-pink">
              <span className="blink">EST. 2026</span>
              <span>|</span>
              <button onClick={() => setShowTerms(true)} className="hover:text-punk-cyan cursor-pointer">TERMS OF CHAOS</button>
              <span>|</span>
              <button onClick={() => setShowPrivacy(true)} className="hover:text-punk-yellow cursor-pointer">PRIVACY IS DEAD</button>
            </div>
          </div>
        </footer>

        {/* Modals */}
        <AnimatePresence>
          {showTerms && (
            <div className="fixed inset-0 bg-black/90 z-[100] flex items-centre justify-centre p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="punk-card max-w-lg">
                <h2 className="text-3xl text-punk-pink mb-4">TERMS OF CHAOS</h2>
                <div className="text-zinc-400 space-y-4 text-sm">
                  <p>1. Don't be a corporate shill.</p>
                  <p>2. Respect the anarchy, but don't be a jerk.</p>
                  <p>3. Your data is yours, until you post it. Then it belongs to the void.</p>
                  <p>4. We are not responsible for your lost soul.</p>
                </div>
                <button onClick={() => setShowTerms(false)} className="punk-button mt-6 w-full">I ACCEPT THE CHAOS</button>
              </motion.div>
            </div>
          )}
          {showPrivacy && (
            <div className="fixed inset-0 bg-black/90 z-[100] flex items-centre justify-centre p-4">
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="punk-card max-w-lg">
                <h2 className="text-3xl text-punk-cyan mb-4">PRIVACY IS DEAD</h2>
                <div className="text-zinc-400 space-y-4 text-sm">
                  <p>We don't track you. We don't want your data. We don't even want to know who you are.</p>
                  <p>But remember: if you post it, the internet remembers. Forever.</p>
                  <p>Stay safe in the digital basement.</p>
                </div>
                <button onClick={() => setShowPrivacy(false)} className="punk-button mt-6 w-full">UNDERSTOOD</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}
