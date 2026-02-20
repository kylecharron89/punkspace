import React, { useState } from 'react';
import { motion } from 'motion/react';

interface AuthProps {
  onLogin: (user: any) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const endpoint = isLogin ? '/api/login' : '/api/register';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      onLogin(data);
    } else {
      setError(data.error || 'Something went wrong');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="punk-card"
      >
        <h2 className="text-4xl mb-6 text-punk-pink">{isLogin ? 'LOGIN' : 'JOIN THE ANARCHY'}</h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-punk-cyan">USERNAME</label>
            <input 
              type="text" 
              className="punk-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          
          <div className="flex flex-col gap-1">
            <label className="text-sm text-punk-cyan">PASSWORD</label>
            <input 
              type="password" 
              className="punk-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-punk-red text-sm font-bold">{error}</div>}

          <button type="submit" className="punk-button mt-4">
            {isLogin ? 'ENTER' : 'CREATE ACCOUNT'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-zinc-500 hover:text-white underline text-sm"
          >
            {isLogin ? "Don't have an account? Join us." : "Already an anarchist? Login."}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
