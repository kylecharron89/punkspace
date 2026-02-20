import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, MessageSquare, User, Layout, Skull, Menu, X } from 'lucide-react';
import Auth from './components/Auth';
import Chat from './components/Chat';
import Profile from './components/Profile';
import Board from './components/Board';
import PostDetail from './components/PostDetail';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-display text-4xl text-punk-pink animate-pulse">LOADING ANARCHY...</div>;

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Header / Marquee */}
        <div className="bg-punk-pink text-black py-1 overflow-hidden border-b-2 border-white">
          <div className="animate-marquee whitespace-nowrap inline-block">
            WELCOME TO PUNKSPACE - THE ONLY PLACE FOR REAL ANARCHISTS - NO CORPORATE BS - SHARE YOUR SOUL - CUSTOMIZE YOUR PROFILE - CHAT IN REAL TIME - WELCOME TO PUNKSPACE - 
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-zinc-900 border-b-2 border-punk-pink p-4 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <Skull className="text-punk-pink group-hover:rotate-12 transition-transform" size={32} />
              <span className="font-display text-3xl text-white group-hover:text-punk-pink transition-colors">PUNKSPACE</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              {user ? (
                <>
                  <Link to="/chat" className="flex items-center gap-1 hover:text-punk-cyan transition-colors"><MessageSquare size={18} /> CHAT</Link>
                  <Link to="/board" className="flex items-center gap-1 hover:text-punk-yellow transition-colors"><Layout size={18} /> BOARD</Link>
                  <Link to={`/profile/${user.username}`} className="flex items-center gap-1 hover:text-punk-green transition-colors"><User size={18} /> MY PROFILE</Link>
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
                    <Link to="/chat" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-xl"><MessageSquare /> CHAT</Link>
                    <Link to="/board" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-xl"><Layout /> BOARD</Link>
                    <Link to={`/profile/${user.username}`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-xl"><User /> PROFILE</Link>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="punk-button bg-punk-red">LOGOUT</button>
                  </>
                ) : (
                  <Link to="/auth" onClick={() => setIsMenuOpen(false)} className="punk-button text-center">LOGIN / JOIN</Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="flex-grow max-w-6xl w-full mx-auto p-4">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col items-center justify-center py-12 text-center">
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
                    <Link to="/chat" className="punk-card hover:border-punk-cyan transition-colors group">
                      <h2 className="text-3xl text-punk-cyan group-hover:text-white">REAL-TIME CHAT</h2>
                      <p className="text-zinc-500">Instant messaging for the underground.</p>
                    </Link>
                    <Link to="/board" className="punk-card hover:border-punk-yellow transition-colors group">
                      <h2 className="text-3xl text-punk-yellow group-hover:text-white">MESSAGE BOARD</h2>
                      <p className="text-zinc-500">Post your manifestos and rants.</p>
                    </Link>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="punk-card border-punk-green">
                      <h3 className="text-xl text-punk-green mb-2 flex items-center gap-2"><Skull size={18} /> PUNK OF THE DAY</h3>
                      <div className="flex items-center gap-3">
                        <img src="https://picsum.photos/seed/punk/100/100" className="w-12 h-12 border border-punk-green" alt="punk" />
                        <div>
                          <div className="font-bold text-white">SID_VICIOUS_99</div>
                          <div className="text-[10px] text-zinc-500">"NEVER TRUST A HIPPIE"</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="punk-card border-punk-red">
                      <h3 className="text-xl text-punk-red mb-2 flex items-center gap-2"><div className="w-2 h-2 bg-punk-red rounded-full animate-ping" /> ONLINE NOW</h3>
                      <div className="flex flex-wrap gap-2">
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="w-8 h-8 border border-zinc-700 overflow-hidden" title={`User ${i}`}>
                            <img src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${i}`} alt="user" />
                          </div>
                        ))}
                        <div className="w-8 h-8 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-500">+12</div>
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
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-zinc-500 text-sm">
              &copy; 2006-2026 PUNKSPACE. ALL RIGHTS RESERVED. NO COPYRIGHT. STEAL EVERYTHING.
            </div>
            <div className="flex gap-4 text-punk-pink">
              <span className="blink">EST. 2026</span>
              <span>|</span>
              <span className="hover:text-punk-cyan cursor-pointer">TERMS OF CHAOS</span>
              <span>|</span>
              <span className="hover:text-punk-yellow cursor-pointer">PRIVACY IS DEAD</span>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
