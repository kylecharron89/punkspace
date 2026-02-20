import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { MessageSquare, Plus, Clock, User as UserIcon } from 'lucide-react';

interface BoardProps {
  user: any;
}

export default function Board({ user }: BoardProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = () => {
    setLoading(true);
    fetch('/api/board')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPost)
    });
    if (res.ok) {
      setNewPost({ title: '', content: '' });
      setIsCreating(false);
      fetchPosts();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-4xl text-punk-yellow">MESSAGE BOARD</h2>
        {user && (
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="punk-button flex items-center gap-2"
          >
            {isCreating ? 'CANCEL' : <><Plus size={20} /> NEW POST</>}
          </button>
        )}
      </div>

      {isCreating && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="punk-card"
        >
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-punk-cyan">TITLE</label>
              <input 
                type="text" 
                className="punk-input" 
                value={newPost.title}
                onChange={e => setNewPost({...newPost, title: e.target.value})}
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-punk-cyan">CONTENT (MARKDOWN SUPPORTED)</label>
              <textarea 
                className="punk-input h-32" 
                value={newPost.content}
                onChange={e => setNewPost({...newPost, content: e.target.value})}
                required
              />
            </div>
            <button type="submit" className="punk-button">PUBLISH MANIFESTO</button>
          </form>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center py-12 text-2xl animate-pulse text-punk-yellow">READING THE WALLS...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {posts.map(post => (
            <Link 
              key={post.id} 
              to={`/board/${post.id}`}
              className="punk-card hover:border-white transition-colors group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl text-punk-cyan group-hover:text-white transition-colors">{post.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                    <span className="flex items-center gap-1"><UserIcon size={12} /> {post.username}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(post.timestamp).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1 text-punk-pink"><MessageSquare size={12} /> {post.comment_count} COMMENTS</span>
                  </div>
                </div>
                <div className="hidden md:block">
                  <img 
                    src={post.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.username}`} 
                    className="w-12 h-12 border border-punk-pink"
                    alt={post.username}
                  />
                </div>
              </div>
            </Link>
          ))}
          {posts.length === 0 && (
            <div className="text-center py-12 text-zinc-600 italic">No manifestos yet. Be the first to speak.</div>
          )}
        </div>
      )}
    </div>
  );
}
