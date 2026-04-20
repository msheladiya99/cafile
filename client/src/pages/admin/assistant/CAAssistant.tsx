import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Paper, Typography, TextField, Button, IconButton, 
    List, ListItem, ListItemButton, ListItemText, Divider, ListItemIcon,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab
} from '@mui/material';
import { 
    Send as SendIcon, AutoAwesome, UploadFile,
    Add as AddIcon, ChatBubbleOutline
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getSubdomain = () => {
    const host = window.location.hostname;
    if (host.includes('localhost') || host.match(/^[\d.]+$/)) {
        const parts = host.split('.');
        return parts.length > 1 ? parts[0] : '';
    }
    const parts = host.split('.');
    if (parts.length >= 3) return parts[0];
    return '';
};

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: string;
}

export interface Chat {
    _id: string;
    title: string;
}

export const CAAssistant: React.FC = () => {
    const { token } = useAuth();
    
    // States
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Draft Generator Modal
    const [draftModalOpen, setDraftModalOpen] = useState(false);
    const [draftTopic, setDraftTopic] = useState('');
    const [draftDetails, setDraftDetails] = useState('');
    
    // Knowledge Base Modal
    const [kbModalOpen, setKbModalOpen] = useState(false);
    const [kbTab, setKbTab] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const headers = { 
        Authorization: `Bearer ${token}`,
        'X-Tenant-Id': getSubdomain(),
    };

    const fetchHistory = async () => {
        try {
            const res = await fetch(`${API_BASE}/assistant/history`, { headers });
            if (res.ok) {
                const data = await res.json();
                setChats(data.data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (token) fetchHistory();
    }, [token]);

    const loadChat = async (id: string) => {
        try {
            const res = await fetch(`${API_BASE}/assistant/chat/${id}`, { headers });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
                setActiveChatId(id);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const startNewChat = () => {
        setActiveChatId(null);
        setMessages([{ role: 'assistant', content: 'Hello! I am your AI Assistant. I can help you with Tax Queries, drafting notices, and searching your knowledge base. How can I help today?' }]);
    };

    useEffect(() => {
        if (!activeChatId) startNewChat();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/assistant/chat`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, chatId: activeChatId })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
                if (!activeChatId) {
                    setActiveChatId(data.chatId);
                    fetchHistory(); // refresh sidebar if new chat
                }
            } else {
                toast.error(data.message || 'Failed to get response');
            }
        } catch {
            toast.error('Network Error');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateDraft = async () => {
        if (!draftTopic.trim()) return toast.error('Topic is required');
        setLoading(true);
        setDraftModalOpen(false);
        setMessages([{ role: 'user', content: `Draft request: ${draftTopic}` }]);

        try {
            const res = await fetch(`${API_BASE}/assistant/draft`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: draftTopic, draftType: 'Notice Reply', details: draftDetails })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.draft }]);
                // Reset active chat to prevent saving to incorrect history
                setActiveChatId(null);
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error('Network Error');
        } finally {
            setLoading(false);
            setDraftTopic('');
            setDraftDetails('');
        }
    };

    const handleUploadKB = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        
        const formData = new FormData();
        formData.append('file', file);
        
        setUploading(true);
        try {
            const res = await fetch(`${API_BASE}/assistant/upload`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'X-Tenant-Id': getSubdomain(),
                }, // No Content-Type for FormData
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                toast.success('Document uploaded to Knowledge Base!');
                setKbModalOpen(false);
            } else {
                toast.error(data.message);
            }
        } catch {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveNote = async () => {
        if (!noteTitle || !noteContent) return toast.error('Both fields required');
        
        setUploading(true);
        try {
            const res = await fetch(`${API_BASE}/assistant/embed`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: noteTitle, content: noteContent })
            });
            if (res.ok) {
                toast.success('Note saved to Knowledge Base!');
                setKbModalOpen(false);
                setNoteTitle('');
                setNoteContent('');
            } else {
                const data = await res.json();
                toast.error(data.message);
            }
        } catch {
            toast.error('Save failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: 'calc(100vh - 140px)', gap: 3, p: 1, overflow: 'hidden' }}>
            
            {/* Sidebar (History Box) */}
            <Paper elevation={0} sx={{ 
                width: 280, 
                flexShrink: 0,
                borderRadius: 4, 
                border: '1px solid rgba(0,0,0,0.08)', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                background: '#ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
                <Box sx={{ p: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white' }}>
                    <Typography variant="h6" fontWeight="800" display="flex" alignItems="center" gap={1.5} sx={{ letterSpacing: '-0.5px' }}>
                        <AutoAwesome sx={{ fontSize: 24 }} /> CA Assistant AI
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, mt: 0.5, display: 'block' }}>
                        Internal Knowledge Engine
                    </Typography>
                </Box>
                
                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Button 
                        variant="contained" 
                        fullWidth 
                        startIcon={<AddIcon />}
                        onClick={startNewChat}
                        sx={{ 
                            background: '#f8fafc', 
                            color: '#4f46e5', 
                            boxShadow: 'none', 
                            borderRadius: 2.5,
                            border: '1px solid #e2e8f0',
                            py: 1,
                            '&:hover': { background: '#f1f5f9', boxShadow: 'none', borderColor: '#cbd5e1' } 
                        }}
                    >
                        New Conversation
                    </Button>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            onClick={() => setDraftModalOpen(true)} 
                            sx={{ borderRadius: 2, py: 1, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                            Draft Mode
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            onClick={() => setKbModalOpen(true)} 
                            sx={{ borderRadius: 2, py: 1, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}
                        >
                            Knowledge Base
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ opacity: 0.6 }} />

                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1, py: 2 }}>
                    <Typography variant="caption" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                        Recent History
                    </Typography>
                    <List disablePadding>
                        {chats.map(c => (
                            <ListItem key={c._id} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton 
                                    selected={activeChatId === c._id} 
                                    onClick={() => loadChat(c._id)} 
                                    sx={{ 
                                        borderRadius: 2,
                                        mx: 1,
                                        '&.Mui-selected': { 
                                            background: '#f0fdf4',
                                            '&:hover': { background: '#dcfce7' }
                                        } 
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}><ChatBubbleOutline sx={{ fontSize: 18 }} color={activeChatId === c._id ? "primary" : "inherit"} /></ListItemIcon>
                                    <ListItemText 
                                        primary={c.title} 
                                        primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: activeChatId === c._id ? 700 : 500, noWrap: true, color: activeChatId === c._id ? '#166534' : '#475569' }} 
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Paper>

            {/* Main Chat Area */}
            <Paper elevation={0} sx={{ 
                flexGrow: 1, 
                borderRadius: 4, 
                border: '1px solid rgba(0,0,0,0.08)', 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}>
                
                {/* Messages Container */}
                <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    p: { xs: 2, md: 4 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: 3, 
                    background: '#ffffff',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: '10px' }
                }}>
                    {messages.length === 0 && (
                        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                             <AutoAwesome sx={{ fontSize: 64, color: '#6366f1', mb: 2, opacity: 0.3 }} />
                             <Typography variant="h6" fontWeight="600">How can I assist you today?</Typography>
                             <Typography variant="body2">Ask about tax laws, draft notices, or query your docs.</Typography>
                        </Box>
                    )}
                    {messages.map((m, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                            <Box sx={{ 
                                maxWidth: '85%', 
                                p: 2.5, 
                                borderRadius: m.role === 'user' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                                background: m.role === 'user' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#f1f5f9',
                                color: m.role === 'user' ? '#ffffff' : '#1e293b',
                                boxShadow: m.role === 'user' ? '0 10px 15px -3px rgba(79, 70, 229, 0.2)' : 'none',
                                '& p': { m: 0, mb: 1.5, '&:last-child': { mb: 0 } },
                                '& ul, & ol': { mt: 0, pl: 2.5 },
                                '& li': { mb: 0.5 },
                                '& strong': { fontWeight: 800, color: m.role === 'user' ? '#fff' : '#0f172a' }
                            }}>
                                {m.role === 'assistant' ? (
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                ) : (
                                    <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.6 }}>{m.content}</Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Box sx={{ p: 2, px: 3, borderRadius: '24px 24px 24px 4px', background: '#f1f5f9', display: 'flex', gap: 2, alignItems: 'center' }}>
                                <CircularProgress size={16} thickness={6} sx={{ color: '#6366f1' }} />
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', letterSpacing: '0.5px' }}>THINKING...</Typography>
                            </Box>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 3, background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={6}
                            placeholder="Type your tax query or draft request..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 4,
                                    pr: 7,
                                    background: '#f8fafc',
                                    transition: 'all 0.2s ease',
                                    '& fieldset': { borderColor: '#e2e8f0' },
                                    '&:hover fieldset': { borderColor: '#cbd5e1' },
                                    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' }
                                }
                            }}
                        />
                        <IconButton 
                            onClick={handleSend} 
                            disabled={loading || !input.trim()}
                            sx={{ 
                                position: 'absolute',
                                right: 8,
                                bottom: 8,
                                background: input.trim() ? '#4f46e5' : '#e2e8f0', 
                                color: '#fff', 
                                borderRadius: 3,
                                width: 44,
                                height: 44,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { background: '#4338ca', transform: 'scale(1.05)' },
                                '&:disabled': { background: '#f1f5f9', color: '#94a3b8' }
                            }}
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1.5, display: 'block', textAlign: 'center', color: '#94a3b8', fontWeight: 500, fontStyle: 'italic' }}>
                        Powered by CA Assistant AI • Verified Bare Act Knowledge
                    </Typography>
                </Box>
            </Paper>


            {/* Draft Modal */}
            <Dialog open={draftModalOpen} onClose={() => setDraftModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Generate Professional Draft</DialogTitle>
                <DialogContent>
                    <TextField 
                        label="Topic / Subject" 
                        fullWidth margin="normal" 
                        value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)}
                        placeholder="e.g. Reply to Section 143(2) Notice"
                    />
                    <TextField 
                        label="Details & Facts" 
                        fullWidth margin="normal" multiline rows={4}
                        value={draftDetails} onChange={(e) => setDraftDetails(e.target.value)}
                        placeholder="e.g. Client deposited 5 Lakhs out of past savings..."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDraftModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleGenerateDraft}>Generate Draft</Button>
                </DialogActions>
            </Dialog>

            {/* Knowledge Base Upload Modal */}
            <Dialog open={kbModalOpen} onClose={() => setKbModalOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add to Firm Knowledge Base</DialogTitle>
                <DialogContent>
                    <Tabs value={kbTab} onChange={(_, v) => setKbTab(v)} sx={{ mb: 2 }}>
                        <Tab label="Upload Document" />
                        <Tab label="Paste Note" />
                    </Tabs>

                    {kbTab === 0 ? (
                        <Box sx={{ mt: 2, textAlign: 'center', p: 4, border: '2px dashed #cbd5e1', borderRadius: 2 }}>
                            <UploadFile sx={{ fontSize: 40, color: '#94a3b8', mb: 1 }} />
                            <Typography gutterBottom>Upload Internal Circulars, Notes, or Rulings</Typography>
                            <Button variant="outlined" component="label" disabled={uploading}>
                                {uploading ? 'Processing...' : 'Select PDF/Image'}
                                <input type="file" hidden onChange={handleUploadKB} accept=".pdf,.png,.jpg" />
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <TextField 
                                label="Title" 
                                fullWidth margin="normal" 
                                value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                            />
                            <TextField 
                                label="Description / Content" 
                                fullWidth margin="normal" multiline rows={4}
                                value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setKbModalOpen(false)}>Close</Button>
                    {kbTab === 1 && <Button variant="contained" onClick={handleSaveNote} disabled={uploading}>Save to KB</Button>}
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default CAAssistant;
