import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, ArrowLeft, Send, User as UserIcon } from 'lucide-react';

interface PostDetailProps {
  user: any;
}

export default function PostDetail({ user }: PostDetailProps) {
  const { id } = useParams();
  const [post, setPost] = useState<any>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  const blockedUsers = user?.blocked_users ? JSON.parse(user.blocked_users) : [];

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = () => {
    setLoading(true);
    fetch(`/api/board/${id}`)
      .then(res => res.json())
      .then(data => {
        setPost(data);
        setLoading(false);
      });
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const res = await fetch(`/api/board/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment })
    });
    if (res.ok) {
      setComment('');
      fetchPost();
    }
  };

  if (loading) return <div className="text-center py-20 text-2xl text-punk-cyan animate-pulse">DECODING MANIFESTO...</div>;
  if (!post) return <div className="text-center py-20 text-punk-red">POST LOST IN THE VOID.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link to="/board" className="flex items-centre gap-2 text-punk-pink hover:text-white transition-colours">
        <ArrowLeft size={20} /> BACK TO BOARD
      </Link>

      <div className="punk-card border-punk-cyan">
        <div className="flex items-centre gap-4 mb-6 pb-4 border-b border-zinc-800">
          <img 
            src={post.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${post.username}`} 
            className="w-16 h-16 border-2 border-punk-cyan"
            alt={post.username}
          />
          <div>
            <h1 className="text-4xl text-white">{post.title}</h1>
            <div className="text-sm text-zinc-500">
              BY <Link to={`/profile/${post.username}`} className="text-punk-cyan hover:underline">{post.username}</Link> ON {new Date(post.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="prose prose-invert max-w-none markdown-body">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl text-punk-pink flex items-centre gap-2"><MessageSquare size={24} /> COMMENTS</h3>
        
        {user && (
          <form onSubmit={handleAddComment} className="punk-card flex gap-2">
            <input 
              type="text" 
              className="flex-grow punk-input" 
              placeholder="ADD YOUR TWO CENTS..."
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button type="submit" className="punk-button p-2"><Send size={20} /></button>
          </form>
        )}

        <div className="space-y-4">
          {post.comments
            .filter((c: any) => !blockedUsers.includes(c.user_id))
            .map((c: any) => (
              <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={c.id} 
              className="punk-card bg-zinc-900/50 border-zinc-800"
            >
              <div className="flex gap-4">
                <img 
                  src={c.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${c.username}`} 
                  className="w-10 h-10 border border-zinc-700"
                  alt={c.username}
                />
                <div className="flex-grow">
                  <div className="flex justify-between items-centre mb-1">
                    <Link to={`/profile/${c.username}`} className="font-bold text-punk-cyan text-sm hover:underline">{c.username}</Link>
                    <span className="text-[10px] text-zinc-600">{new Date(c.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-zinc-300 text-sm">{c.content}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {post.comments.length === 0 && (
            <div className="text-center py-8 text-zinc-700 italic">Silence. Say something.</div>
          )}
        </div>
      </div>
    </div>
  );
}
