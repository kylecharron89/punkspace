import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { motion } from 'motion/react';
import { Send, Image as ImageIcon, Hash } from 'lucide-react';

interface ChatProps {
  user: any;
}

export default function Chat({ user }: ChatProps) {
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => {
        setRooms(data);
        if (data.length > 0) setActiveRoom(data[0]);
      });

    socketRef.current = io();

    socketRef.current.on('new_message', (message: any) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (activeRoom) {
      setMessages([]);
      fetch(`/api/rooms/${activeRoom.id}/messages`)
        .then(res => res.json())
        .then(data => setMessages(data));
      
      socketRef.current?.emit('join_room', activeRoom.id);
    }
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeRoom) return;

    socketRef.current?.emit('send_message', {
      room_id: activeRoom.id,
      user_id: user.id,
      content: newMessage,
      type: 'text'
    });
    setNewMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      
      socketRef.current?.emit('send_message', {
        room_id: activeRoom.id,
        user_id: user.id,
        content: data.url,
        type: 'image'
      });
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-200px)] gap-4">
      {/* Rooms Sidebar */}
      <div className="w-full md:w-64 punk-card flex flex-col gap-4 overflow-y-auto">
        <h3 className="text-2xl text-punk-cyan border-b border-punk-cyan pb-2 flex items-center gap-2">
          <Hash size={20} /> ROOMS
        </h3>
        <div className="flex flex-col gap-2">
          {rooms.map(room => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room)}
              className={`text-left p-2 transition-colors border-l-4 ${
                activeRoom?.id === room.id 
                  ? 'bg-punk-pink/20 border-punk-pink text-white' 
                  : 'border-transparent text-zinc-500 hover:text-white hover:bg-zinc-800'
              }`}
            >
              # {room.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-grow punk-card flex flex-col p-0 overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-punk-pink bg-zinc-800 flex justify-between items-center">
          <h3 className="text-xl text-punk-pink font-bold">
            {activeRoom ? `# ${activeRoom.name}` : 'SELECT A ROOM'}
          </h3>
          <span className="text-xs text-zinc-500">{activeRoom?.description}</span>
        </div>

        {/* Messages */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              key={msg.id || idx} 
              className="flex gap-3"
            >
              <img 
                src={msg.avatar_url || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${msg.username}`} 
                className="w-10 h-10 border border-punk-cyan"
                alt={msg.username}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-punk-cyan text-sm">{msg.username}</span>
                  <span className="text-[10px] text-zinc-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-zinc-300 text-sm mt-1">
                  {msg.type === 'image' ? (
                    <img src={msg.content} className="max-w-xs md:max-w-md border-2 border-white shadow-lg" alt="Shared image" />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-punk-pink bg-zinc-800 flex gap-2">
          <label className="punk-button p-2 cursor-pointer bg-zinc-700">
            <ImageIcon size={20} />
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
          <input 
            type="text" 
            className="flex-grow punk-input" 
            placeholder="TYPE SOMETHING ANARCHIC..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="punk-button p-2">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
