import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Edit2, Save, X, User as UserIcon, Heart, Music, Skull, Star, StarOff } from 'lucide-react';

interface ProfileProps {
  currentUser: any;
}

export default function Profile({ currentUser }: ProfileProps) {
  const { username } = useParams();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    bio: '',
    profile_css: '',
    profile_html: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [username]);

  const fetchUser = () => {
    setLoading(true);
    fetch(`/api/users/${username}`)
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditData({
          bio: data.bio || '',
          profile_css: data.profile_css || '',
          profile_html: data.profile_html || '',
          avatar_url: data.avatar_url || ''
        });
        setLoading(false);
      });
  };

  // Inject custom CSS
  useEffect(() => {
    if (user?.profile_css) {
      const style = document.createElement('style');
      style.id = 'custom-profile-css';
      style.innerHTML = user.profile_css;
      document.head.appendChild(style);
      return () => {
        const existing = document.getElementById('custom-profile-css');
        if (existing) existing.remove();
      };
    }
  }, [user]);

  const handleSave = async () => {
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editData)
    });
    if (res.ok) {
      setUser({ ...user, ...editData });
      setIsEditing(false);
    }
  };

  const handleToggleTopFriend = async (action: 'add' | 'remove') => {
    if (!currentUser || !user) return;
    const res = await fetch('/api/friends/top', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ friendId: user.id, action })
    });
    if (res.ok) {
      // Refresh to show updated top friends if viewing own profile or just for feedback
      fetchUser();
    }
  };

  if (loading) return <div className="text-centre py-20 font-display text-4xl text-punk-pink animate-pulse">FETCHING SOUL...</div>;
  if (!user) return <div className="text-centre py-20 text-punk-red">USER NOT FOUND IN THE VOID.</div>;

  const isOwnProfile = currentUser?.username === username;
  const isTopFriend = currentUser?.top_friends?.includes(user.id);

  return (
    <div className="profile-container space-y-8">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/3 space-y-4">
          <div className="punk-card relative group border-punk-cyan">
            <img 
              src={user.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.username}`} 
              className="w-full aspect-square border-4 border-white shadow-[8px_8px_0px_0px_rgba(0,255,255,1)]"
              alt={user.username}
            />
            {isOwnProfile && (
              <button 
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-4 -right-4 punk-button flex items-center gap-2 bg-punk-yellow text-black"
              >
                <Edit2 size={16} /> EDIT PROFILE
              </button>
            )}
          </div>
          
          <div className="punk-card bg-zinc-800">
            <h3 className="text-xl text-punk-cyan mb-2 flex items-center gap-2"><Heart size={18} /> CONTACTING</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button className="punk-button py-1 text-[10px]">SEND MESSAGE</button>
              {!isOwnProfile && currentUser && (
                <button 
                  onClick={() => handleToggleTopFriend(isTopFriend ? 'remove' : 'add')}
                  className={`punk-button py-1 text-[10px] flex items-center justify-centre gap-1 ${isTopFriend ? 'bg-punk-red' : 'bg-punk-cyan'}`}
                >
                  {isTopFriend ? <><StarOff size={12}/> REMOVE TOP</> : <><Star size={12}/> ADD TO TOP</>}
                </button>
              )}
              <button className="punk-button py-1 text-[10px] bg-punk-yellow">INSTANT MSG</button>
              <button className="punk-button py-1 text-[10px] bg-punk-red">BLOCK USER</button>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3 space-y-6">
          <div className="punk-card">
            <h1 className="text-5xl text-white mb-2">{user.username}</h1>
            <p className="text-punk-pink font-bold italic">" {user.bio || 'No manifesto yet.'} "</p>
            <div className="mt-4 text-xs text-zinc-500">
              MEMBER SINCE: {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>

          {/* Custom HTML Area */}
          {user.profile_html && (
            <div className="custom-html-area" dangerouslySetInnerHTML={{ __html: user.profile_html }} />
          )}

          <div className="punk-card">
            <h3 className="text-2xl text-punk-yellow mb-4 flex items-center gap-2"><Music size={24} /> TOP FRIENDS</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {user.top_friends_data && user.top_friends_data.length > 0 ? (
                user.top_friends_data.map((friend: any) => (
                  <Link key={friend.id} to={`/profile/${friend.username}`} className="flex flex-col items-center gap-1 group">
                    <div className="w-20 h-20 border-2 border-punk-pink overflow-hidden group-hover:border-white transition-colors">
                      <img 
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.username}`} 
                        alt={friend.username} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-400 group-hover:text-punk-pink">{friend.username}</span>
                  </Link>
                ))
              ) : (
                <div className="col-span-4 text-centre py-4 text-zinc-600 italic">
                  This punk is a lone wolf. No top friends yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-centre p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="punk-card w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-centre mb-6">
              <h2 className="text-3xl text-punk-pink">EDIT YOUR SOUL</h2>
              <button onClick={() => setIsEditing(false)} className="text-zinc-500 hover:text-white"><X size={32} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-punk-cyan font-bold">AVATAR URL</label>
                  <input 
                    type="text" 
                    className="punk-input text-sm" 
                    value={editData.avatar_url}
                    onChange={e => setEditData({...editData, avatar_url: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-punk-cyan font-bold">BIO / MANIFESTO</label>
                  <textarea 
                    className="punk-input text-sm h-24" 
                    value={editData.bio}
                    onChange={e => setEditData({...editData, bio: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-punk-pink font-bold">CUSTOM CSS (COLOURS, FONTS, ETC)</label>
                  <textarea 
                    className="punk-input text-xs font-mono h-32" 
                    placeholder="body { background: red; }"
                    value={editData.profile_css}
                    onChange={e => setEditData({...editData, profile_css: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-punk-yellow font-bold">CUSTOM HTML (WIDGETS, ETC)</label>
                  <textarea 
                    className="punk-input text-xs font-mono h-32" 
                    placeholder="<marquee>HELLO WORLD</marquee>"
                    value={editData.profile_html}
                    onChange={e => setEditData({...editData, profile_html: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => setIsEditing(false)} className="punk-button bg-zinc-700">CANCEL</button>
              <button onClick={handleSave} className="punk-button flex items-center gap-2"><Save size={18} /> SAVE PROFILE</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
