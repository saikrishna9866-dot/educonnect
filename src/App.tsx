import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { 
  MessageSquare, 
  User as UserIcon, 
  GraduationCap, 
  Send, 
  CheckCircle, 
  Clock, 
  PlusCircle,
  LogOut,
  Search,
  ChevronRight,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Role, User, Doubt, Message } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [selectedDoubt, setSelectedDoubt] = useState<Doubt | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const socketRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketRef.current = io();

    socketRef.current.on('init', (initialDoubts: Doubt[]) => {
      setDoubts(initialDoubts);
    });

    socketRef.current.on('doubt-created', (newDoubt: Doubt) => {
      setDoubts(prev => [...prev, newDoubt]);
    });

    socketRef.current.on('doubt-updated', (updatedDoubt: Doubt) => {
      setDoubts(prev => prev.map(d => d.id === updatedDoubt.id ? updatedDoubt : d));
      if (selectedDoubt?.id === updatedDoubt.id) {
        setSelectedDoubt(updatedDoubt);
      }
    });

    socketRef.current.on('message-received', ({ doubtId, message }: { doubtId: string, message: Message }) => {
      setDoubts(prev => prev.map(d => {
        if (d.id === doubtId) {
          return { ...d, messages: [...d.messages, message] };
        }
        return d;
      }));
      
      if (selectedDoubt?.id === doubtId) {
        setSelectedDoubt(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
      }
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [selectedDoubt]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedDoubt?.messages]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && role) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: name.trim(),
        role
      };
      setUser(newUser);
    }
  };

  const handleCreateDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newQuestion.trim() || !newSubject.trim()) return;

    const newDoubt: Doubt = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: user.id,
      studentName: user.name,
      subject: newSubject,
      question: newQuestion,
      status: 'pending',
      timestamp: Date.now(),
      messages: []
    };

    socketRef.current?.emit('create-doubt', newDoubt);
    setNewQuestion('');
    setNewSubject('');
    setIsCreating(false);
  };

  const handleAnswerDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDoubt || !answerText.trim()) return;

    socketRef.current?.emit('answer-doubt', {
      doubtId: selectedDoubt.id,
      answer: answerText,
      facultyId: user.id,
      facultyName: user.name
    });
    setAnswerText('');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDoubt || !chatMessage.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      content: chatMessage,
      timestamp: Date.now()
    };

    socketRef.current?.emit('send-message', {
      doubtId: selectedDoubt.id,
      message: newMessage
    });
    setChatMessage('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[32px] p-8 shadow-sm border border-black/5"
        >
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
              <GraduationCap size={32} />
            </div>
          </div>
          
          <h1 className="text-3xl font-serif text-center mb-2 text-[#1A1A1A]">EduConnect</h1>
          <p className="text-center text-[#5A5A40]/60 mb-8 font-serif italic">Bridge the gap between learning and understanding</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Your Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all"
                placeholder="Enter your full name"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  role === 'student' 
                  ? 'bg-[#5A5A40] text-white border-[#5A5A40]' 
                  : 'bg-white text-[#1A1A1A] border-black/10 hover:border-[#5A5A40]/50'
                }`}
              >
                <UserIcon size={24} />
                <span className="text-sm font-medium">Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('faculty')}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  role === 'faculty' 
                  ? 'bg-[#5A5A40] text-white border-[#5A5A40]' 
                  : 'bg-white text-[#1A1A1A] border-black/10 hover:border-[#5A5A40]/50'
                }`}
              >
                <GraduationCap size={24} />
                <span className="text-sm font-medium">Faculty</span>
              </button>
            </div>
            
            <button
              type="submit"
              disabled={!role || !name.trim()}
              className="w-full bg-[#5A5A40] text-white py-4 rounded-xl font-medium hover:bg-[#4A4A30] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Get Started
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <h2 className="font-serif text-xl text-[#1A1A1A]">EduConnect</h2>
            <p className="text-xs text-[#5A5A40]/60 uppercase tracking-wider font-medium">
              {user.role === 'student' ? 'Student Portal' : 'Faculty Portal'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-sm font-medium text-[#1A1A1A]">{user.name}</p>
            <p className="text-xs text-[#5A5A40]/60">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
          </div>
          <button 
            onClick={() => setUser(null)}
            className="p-2 text-[#5A5A40]/60 hover:text-[#1A1A1A] transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar - Doubt List */}
        <div className="w-full md:w-[400px] border-r border-black/5 bg-white flex flex-col">
          <div className="p-4 border-b border-black/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={18} />
              <input 
                type="text" 
                placeholder="Search doubts..."
                className="w-full pl-10 pr-4 py-2 bg-[#F5F5F0] rounded-lg text-sm focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {user.role === 'student' && (
              <button 
                onClick={() => {
                  setIsCreating(true);
                  setSelectedDoubt(null);
                }}
                className="w-full p-4 flex items-center gap-3 text-[#5A5A40] hover:bg-[#F5F5F0] transition-colors border-b border-black/5"
              >
                <PlusCircle size={20} />
                <span className="font-medium">Post a new doubt</span>
              </button>
            )}
            
            <div className="divide-y divide-black/5">
              {doubts
                .filter(d => user.role === 'faculty' || d.studentId === user.id)
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((doubt) => (
                <button
                  key={doubt.id}
                  onClick={() => {
                    setSelectedDoubt(doubt);
                    setIsCreating(false);
                  }}
                  className={`w-full p-4 text-left transition-all hover:bg-[#F5F5F0] ${
                    selectedDoubt?.id === doubt.id ? 'bg-[#F5F5F0] border-l-4 border-[#5A5A40]' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#5A5A40]/60">{doubt.subject}</span>
                    <span className="text-[10px] text-black/30">{new Date(doubt.timestamp).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-medium text-[#1A1A1A] line-clamp-1 mb-2">{doubt.question}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-black/5 rounded-full flex items-center justify-center">
                        <UserIcon size={12} className="text-black/40" />
                      </div>
                      <span className="text-xs text-black/50">{doubt.studentName}</span>
                    </div>
                    {doubt.status === 'answered' ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                        <CheckCircle size={10} /> Answered
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </div>
                </button>
              ))}
              
              {doubts.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-black/30 font-serif italic">No doubts posted yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 bg-[#F5F5F0] flex flex-col relative">
          <AnimatePresence mode="wait">
            {isCreating ? (
              <motion.div 
                key="create"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 p-8 overflow-y-auto"
              >
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-3xl font-serif text-[#1A1A1A] mb-8">Post a New Doubt</h2>
                  <form onSubmit={handleCreateDoubt} className="bg-white rounded-3xl p-8 shadow-sm border border-black/5 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Subject</label>
                      <input 
                        type="text" 
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20"
                        placeholder="e.g. Mathematics, Physics, Computer Science"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Your Question</label>
                      <textarea 
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 min-h-[200px]"
                        placeholder="Describe your doubt in detail..."
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsCreating(false)}
                        className="px-6 py-3 rounded-xl text-[#5A5A40] font-medium hover:bg-black/5 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="bg-[#5A5A40] text-white px-8 py-3 rounded-xl font-medium hover:bg-[#4A4A30] transition-colors"
                      >
                        Post Doubt
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            ) : selectedDoubt ? (
              <motion.div 
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Doubt Detail Header */}
                <div className="bg-white border-b border-black/5 p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] font-bold uppercase rounded tracking-wider">
                      {selectedDoubt.subject}
                    </span>
                    {selectedDoubt.status === 'answered' && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded tracking-wider flex items-center gap-1">
                        <CheckCircle size={10} /> Answered
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-serif text-[#1A1A1A] mb-4">{selectedDoubt.question}</h2>
                  <div className="flex items-center gap-4 text-sm text-black/40">
                    <div className="flex items-center gap-1">
                      <UserIcon size={14} />
                      <span>{selectedDoubt.studentName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{new Date(selectedDoubt.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Chat/Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Initial Question */}
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-black/5 rounded-full flex-shrink-0 flex items-center justify-center">
                      <UserIcon size={20} className="text-black/40" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-black/5 max-w-[80%]">
                      <p className="text-[#1A1A1A] leading-relaxed">{selectedDoubt.question}</p>
                    </div>
                  </div>

                  {/* Faculty Answer */}
                  {selectedDoubt.answer && (
                    <div className="flex gap-4 flex-row-reverse">
                      <div className="w-10 h-10 bg-[#5A5A40] rounded-full flex-shrink-0 flex items-center justify-center text-white">
                        <GraduationCap size={20} />
                      </div>
                      <div className="bg-[#5A5A40] text-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-[80%]">
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">Faculty Answer • {selectedDoubt.facultyName}</p>
                        <p className="leading-relaxed">{selectedDoubt.answer}</p>
                      </div>
                    </div>
                  )}

                  {/* Discussion Messages */}
                  {selectedDoubt.messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-4 ${msg.senderId === user.id ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                        msg.senderRole === 'faculty' ? 'bg-[#5A5A40] text-white' : 'bg-black/5 text-black/40'
                      }`}>
                        {msg.senderRole === 'faculty' ? <GraduationCap size={20} /> : <UserIcon size={20} />}
                      </div>
                      <div className={`p-4 rounded-2xl shadow-sm border border-black/5 max-w-[80%] ${
                        msg.senderId === user.id 
                        ? 'bg-[#5A5A40]/5 rounded-tr-none' 
                        : 'bg-white rounded-tl-none'
                      }`}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-[#5A5A40]/60">
                          {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-[#1A1A1A] leading-relaxed">{msg.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="bg-white border-t border-black/5 p-4">
                  {user.role === 'faculty' && !selectedDoubt.answer && (
                    <form onSubmit={handleAnswerDoubt} className="mb-4">
                      <div className="flex gap-2">
                        <textarea 
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Provide an official answer..."
                          className="flex-1 px-4 py-2 bg-[#F5F5F0] rounded-xl text-sm focus:outline-none min-h-[80px]"
                        />
                        <button 
                          type="submit"
                          className="bg-[#5A5A40] text-white px-4 rounded-xl hover:bg-[#4A4A30] transition-colors"
                        >
                          Answer
                        </button>
                      </div>
                    </form>
                  )}
                  
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Type a message for discussion..."
                      className="flex-1 px-4 py-3 bg-[#F5F5F0] rounded-xl text-sm focus:outline-none"
                    />
                    <button 
                      type="submit"
                      className="w-12 h-12 bg-[#5A5A40] text-white rounded-xl flex items-center justify-center hover:bg-[#4A4A30] transition-colors"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div className="max-w-md">
                  <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center mx-auto mb-6 text-black/20">
                    <MessageCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-serif text-[#1A1A1A] mb-2">Select a doubt</h3>
                  <p className="text-[#5A5A40]/60 font-serif italic">Choose a doubt from the sidebar to view the discussion or provide an answer.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
