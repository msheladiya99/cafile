import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Paper, Typography, TextField, Button, IconButton, 
    List, ListItem, ListItemButton, ListItemText, ListItemIcon,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab, Tooltip, InputAdornment
} from '@mui/material';
import { 
    Send as SendIcon, AutoAwesome, UploadFile,
    Add as AddIcon, ContentCopy, Check,
    Gavel, Calculate, ReceiptLong, AccountBalance, Description,
    Search,
    HistoryOutlined,
    KeyboardArrowDown, DeleteOutline
} from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const GradientOrb = () => (
    <Box
        sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
            boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4), inset 0 0 60px rgba(255,255,255,0.3)',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: '15%',
                left: '20%',
                width: '25%',
                height: '20%',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)',
                filter: 'blur(4px)'
            },
            '@keyframes float': {
                '0%, 100%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(-10px)' }
            },
            animation: 'float 4s ease-in-out infinite',
            '@keyframes pulse1': {
                '0%, 100%': { opacity: 0.4, transform: 'scale(0.8)' },
                '50%': { opacity: 1, transform: 'scale(1)' }
            },
            '@keyframes pulse2': {
                '0%, 100%': { opacity: 0.4, transform: 'scale(0.8)' },
                '50%': { opacity: 1, transform: 'scale(1)' }
            },
            '@keyframes pulse3': {
                '0%, 100%': { opacity: 0.4, transform: 'scale(0.8)' },
                '50%': { opacity: 1, transform: 'scale(1)' }
            }
        }}
    />
);

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

// Quick action suggestion chips shown on welcome screen
const QUICK_ACTIONS = [
    { label: 'TDS on Salary — Section 192', icon: <Calculate sx={{ fontSize: 16 }} />, query: 'Explain TDS deduction on salary under Section 192 with computation steps and applicable rates for FY 2024-25.' },
    { label: 'Section 44AD Presumptive Tax', icon: <ReceiptLong sx={{ fontSize: 16 }} />, query: 'Explain Section 44AD presumptive taxation scheme: eligibility, turnover limit, deemed profit rate, and conditions for opting out.' },
    { label: 'GST Input Tax Credit Rules', icon: <AccountBalance sx={{ fontSize: 16 }} />, query: 'Explain the conditions and restrictions for claiming Input Tax Credit under GST. Include Section 16 of CGST Act and Rule 36.' },
    { label: 'Section 143(2) Notice Reply', icon: <Gavel sx={{ fontSize: 16 }} />, query: 'How should a CA respond to a Section 143(2) scrutiny notice? What are the compliance steps and timelines?' },
    { label: 'Advance Tax Computation', icon: <Calculate sx={{ fontSize: 16 }} />, query: 'Explain advance tax installment schedule, due dates, computation method, and penalties under Sections 234B and 234C for AY 2025-26.' },
    { label: 'Form 3CD Audit Clauses', icon: <Description sx={{ fontSize: 16 }} />, query: 'Explain the most critical clauses in Form 3CD (Tax Audit Report) that a CA must carefully review and the common errors to avoid.' },
];

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <Tooltip title={copied ? 'Copied!' : 'Copy response'}>
            <IconButton size="small" onClick={handleCopy} sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, transition: 'opacity 0.2s' }}>
                {copied ? <Check sx={{ fontSize: 15, color: '#22c55e' }} /> : <ContentCopy sx={{ fontSize: 15 }} />}
            </IconButton>
        </Tooltip>
    );
};

export const CAAssistant: React.FC = () => {
    const { token } = useAuth();
    
    // States
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAllHistory, setShowAllHistory] = useState(false);
    
    // Draft Generator Modal
    const [draftModalOpen, setDraftModalOpen] = useState(false);
    const [draftTopic, setDraftTopic] = useState('');
    const [draftDetails, setDraftDetails] = useState('');
    const [draftType, setDraftType] = useState('Notice Reply');
    
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const deleteChat = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent loading the chat when clicking delete
        try {
            const res = await fetch(`${API_BASE}/assistant/chat/${id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                // Remove from local state
                setChats(prev => prev.filter(c => c._id !== id));
                // If active chat was deleted, clear it
                if (activeChatId === id) {
                    setActiveChatId(null);
                    setMessages([]);
                }
                toast.success('Chat deleted');
            } else {
                toast.error('Failed to delete chat');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error deleting chat');
        }
    };

    const startNewChat = () => {
        setActiveChatId(null);
        setMessages([]);
    };

    useEffect(() => {
        if (!activeChatId) startNewChat();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;
        
        const userMsg = messageText.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        
        // Add placeholder assistant message immediately for instant feedback
        setMessages(prev => [...prev, { role: 'assistant', content: '', timestamp: new Date().toISOString() }]);
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/assistant/chat`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userMsg, chatId: activeChatId, stream: true })
            });

            if (!res.ok) {
                const data = await res.json();
                toast.error(data.message || 'Failed to get response');
                setMessages(prev => prev.slice(0, -1)); // Remove placeholder
                return;
            }

            // Check if streaming is supported
            const contentType = res.headers.get('content-type');
            if (contentType?.includes('text/event-stream') || contentType?.includes('application/x-ndjson')) {
                // Handle streaming response
                const reader = res.body?.getReader();
                const decoder = new TextDecoder();
                let fullContent = '';

                while (reader) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') continue;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    fullContent += parsed.content;
                                    setMessages(prev => {
                                        const newMessages = [...prev];
                                        newMessages[newMessages.length - 1] = { 
                                            role: 'assistant', 
                                            content: fullContent,
                                            timestamp: new Date().toISOString()
                                        };
                                        return newMessages;
                                    });
                                }
                                if (parsed.chatId && !activeChatId) {
                                    setActiveChatId(parsed.chatId);
                                }
                            } catch {
                                // Non-JSON lines are ignored
                            }
                        }
                    }
                }
                
                if (!activeChatId) {
                    fetchHistory();
                }
            } else {
                // Non-streaming fallback
                const data = await res.json();
                if (data.reply) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1] = { 
                            role: 'assistant', 
                            content: data.reply,
                            timestamp: new Date().toISOString()
                        };
                        return newMessages;
                    });
                    if (!activeChatId) {
                        setActiveChatId(data.chatId);
                        fetchHistory();
                    }
                }
            }
        } catch {
            toast.error('Network Error');
            setMessages(prev => prev.slice(0, -1)); // Remove placeholder
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => sendMessage(input);

    const handleQuickAction = (query: string) => {
        sendMessage(query);
    };

    const handleGenerateDraft = async () => {
        if (!draftTopic.trim()) return toast.error('Topic is required');
        setLoading(true);
        setDraftModalOpen(false);
        setMessages([{ role: 'user', content: `📝 Draft Request: ${draftType}\n\n**Topic:** ${draftTopic}\n**Details:** ${draftDetails || 'None provided'}` }]);

        try {
            const res = await fetch(`${API_BASE}/assistant/draft`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: draftTopic, draftType, details: draftDetails })
            });
            const data = await res.json();
            
            if (res.ok) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.draft }]);
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
                },
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

    const isWelcomeScreen = messages.length === 0;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <Box sx={{ 
            display: 'flex', 
            height: 'calc(100vh - 70px)', 
            width: '100%',
            gap: 0, 
            p: 0, 
            overflow: 'hidden',
            margin: '-24px', 
            background: '#f5f7fa'
        }}>
            
            {/* Sidebar */}
            <Paper elevation={0} sx={{ 
                width: 260, 
                flexShrink: 0,
                borderRadius: 0,
                borderRight: 'none',
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                background: '#ffffff',
                py: 3,
                px: 2
            }}>
                {/* Logo */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4, px: 1 }}>
                    <Box sx={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: '10px', 
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>C</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight="700" sx={{ color: '#1e1b4b', fontSize: '1.25rem', letterSpacing: '-0.5px' }}>
                        CA Assistant
                    </Typography>
                </Box>

                {/* New Chat Button */}
                <Button
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={startNewChat}
                    sx={{
                        background: '#1e293b',
                        color: '#ffffff',
                        borderRadius: 3,
                        py: 1.2,
                        mb: 3,
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                        '&:hover': { background: '#334155' }
                    }}
                >
                    New Chat
                </Button>

                {/* Search */}
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    px: 2, 
                    py: 1.5, 
                    mb: 3,
                    background: '#f8fafc',
                    borderRadius: 3,
                    border: '1px solid #e2e8f0'
                }}>
                    <Search sx={{ fontSize: 18, color: '#94a3b8' }} />
                    <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>Search chats</Typography>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '2px', background: '#cbd5e1' }} />
                        <Box sx={{ width: 6, height: 6, borderRadius: '2px', background: '#cbd5e1' }} />
                    </Box>
                </Box>

                {/* Navigation */}
                <List disablePadding sx={{ mb: 2 }}>
                    <ListItem disablePadding sx={{ mb: 0.5 }}>
                        <ListItemButton 
                            onClick={() => setShowAllHistory(!showAllHistory)}
                            sx={{ 
                                borderRadius: 2, 
                                py: 1, 
                                background: showAllHistory ? '#eef2ff' : 'transparent',
                                '&:hover': { background: showAllHistory ? '#e0e7ff' : '#f8fafc' } 
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                                <HistoryOutlined sx={{ fontSize: 20, color: showAllHistory ? '#6366f1' : '#64748b' }} />
                            </ListItemIcon>
                            <ListItemText 
                                primary="History" 
                                primaryTypographyProps={{ 
                                    fontSize: '0.9rem', 
                                    fontWeight: showAllHistory ? 500 : 400, 
                                    color: showAllHistory ? '#4f46e5' : '#64748b' 
                                }} 
                            />
                        </ListItemButton>
                    </ListItem>
                </List>

                {/* History Section */}
                <Typography variant="caption" sx={{ px: 2, mb: 2, display: 'block', fontWeight: 600, color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {showAllHistory ? `All Chats (${chats.length})` : 'Recent'}
                </Typography>
                <List disablePadding sx={{ flexGrow: 1, overflowY: 'auto' }}>
                    {(showAllHistory ? chats : chats.slice(0, 5)).map(c => (
                        <ListItem 
                            key={c._id} 
                            disablePadding 
                            secondaryAction={
                                <Tooltip title="Delete chat">
                                    <IconButton 
                                        edge="end" 
                                        size="small"
                                        onClick={(e) => deleteChat(c._id, e)}
                                        sx={{ 
                                            opacity: 0, 
                                            transition: 'opacity 0.2s',
                                            '&:hover': { color: '#ef4444' }
                                        }}
                                        className="delete-btn"
                                    >
                                        <DeleteOutline sx={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                            }
                            sx={{
                                mb: 0.5,
                                '&:hover .delete-btn': { opacity: 1 }
                            }}
                        >
                            <ListItemButton 
                                selected={activeChatId === c._id} 
                                onClick={() => loadChat(c._id)} 
                                sx={{ 
                                    borderRadius: 2,
                                    py: 0.8,
                                    px: 2,
                                    pr: 5, // Make room for delete button
                                    '&.Mui-selected': { 
                                        background: '#eef2ff',
                                        '&:hover': { background: '#e0e7ff' }
                                    },
                                    '&:hover': { background: '#f8fafc' }
                                }}
                            >
                                <ListItemText 
                                    primary={c.title} 
                                    primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: activeChatId === c._id ? 500 : 400, noWrap: true, color: activeChatId === c._id ? '#4f46e5' : '#64748b' }} 
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Paper>

            {/* Main Chat Area */}
            <Paper elevation={0} sx={{ 
                flexGrow: 1, 
                borderRadius: 0, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                position: 'relative'
            }}>
                {/* Top Bar */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    py: 2,
                    px: 4
                }}>
                    <Button 
                        endIcon={<KeyboardArrowDown />}
                        sx={{ 
                            background: '#f1f5f9', 
                            borderRadius: 3,
                            px: 2,
                            py: 0.8,
                            textTransform: 'none',
                            color: '#475569',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            '&:hover': { background: '#e2e8f0' }
                        }}
                    >
                        CA Assistant
                    </Button>
                </Box>
                
                {/* Messages Container */}
                <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    p: { xs: 2, md: 4 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: isWelcomeScreen ? 0 : 2.5,
                    background: 'transparent',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: '10px' }
                }}>
                    {/* Welcome / Empty State */}
                    {isWelcomeScreen && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', px: 3 }}>
                            {/* Gradient Orb */}
                            <Box sx={{ mb: 4 }}>
                                <GradientOrb />
                            </Box>
                            
                            {/* Greeting */}
                            <Typography variant="h4" fontWeight="600" sx={{ color: '#1e293b', mb: 0.5, fontSize: '2rem', letterSpacing: '-0.5px' }}>
                                {getGreeting()}, CA
                            </Typography>
                            <Typography variant="h5" fontWeight="400" sx={{ color: '#64748b', mb: 6, fontSize: '1.5rem' }}>
                                Can I help you with anything?
                            </Typography>
                        </Box>
                    )}

                    {/* Messages */}
                    {messages.map((m, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 1.5, maxWidth: 800, mx: 'auto', width: '100%' }}>
                            {/* AI Avatar */}
                            {m.role === 'assistant' && (
                                <Box sx={{ 
                                    width: 36, height: 36, borderRadius: '12px', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    mt: 0.5,
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                                }}>
                                    <AutoAwesome sx={{ fontSize: 18, color: 'white' }} />
                                </Box>
                            )}
                            <Box sx={{ maxWidth: '85%' }}>
                                <Box sx={{ 
                                    p: m.role === 'user' ? 2.5 : 3, 
                                    borderRadius: m.role === 'user' ? '20px 20px 6px 20px' : '6px 20px 20px 20px',
                                    background: m.role === 'user' 
                                        ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' 
                                        : '#ffffff',
                                    color: m.role === 'user' ? '#ffffff' : '#334155',
                                    boxShadow: m.role === 'user' 
                                        ? '0 8px 24px rgba(99, 102, 241, 0.3)' 
                                        : '0 4px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
                                    border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                                    '& p': { m: 0, mb: 1.2, '&:last-child': { mb: 0 }, lineHeight: 1.8, fontSize: '0.9rem' },
                                    '& ul, & ol': { mt: 0, pl: 3, mb: 1.2 },
                                    '& li': { mb: 0.8, lineHeight: 1.8, fontSize: '0.9rem' },
                                    '& strong': { fontWeight: 600, color: m.role === 'user' ? '#fff' : '#1e293b' },
                                    '& h2': { fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', mb: 1, mt: 1.5, borderBottom: '1px solid #e2e8f0', pb: 0.8 },
                                    '& h3': { fontSize: '1rem', fontWeight: 600, color: '#475569', mb: 0.8, mt: 1.2 },
                                    '& table': { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', mt: 1.5, mb: 1.5 },
                                    '& th': { background: '#f8fafc', p: '10px 12px', textAlign: 'left', fontWeight: 600, border: '1px solid #e2e8f0', color: '#475569' },
                                    '& td': { p: '10px 12px', border: '1px solid #e2e8f0', color: '#64748b' },
                                    '& code': { background: '#f1f5f9', px: 1, py: 0.3, borderRadius: 1.5, fontSize: '0.85rem', fontFamily: 'monospace', color: '#6366f1' },
                                    '& pre': { background: '#1e293b', p: 2.5, borderRadius: 2, overflow: 'auto', color: '#e2e8f0', fontSize: '0.85rem' },
                                    '& blockquote': { borderLeft: '3px solid #818cf8', pl: 2.5, ml: 0, color: '#64748b', fontStyle: 'italic' },
                                    '& hr': { border: 'none', borderTop: '1px solid #e2e8f0', my: 2 },
                                }}>
                                    {m.role === 'assistant' ? (
                                        m.content ? (
                                            <ReactMarkdown>{m.content}</ReactMarkdown>
                                        ) : loading ? (
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <CircularProgress size={16} thickness={5} sx={{ color: '#6366f1' }} />
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#6366f1' }}>
                                                    Thinking...
                                                </Typography>
                                            </Box>
                                        ) : null
                                    ) : (
                                        <Typography variant="body1" sx={{ fontWeight: 400, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{m.content}</Typography>
                                    )}
                                </Box>
                                {/* Copy button for assistant messages */}
                                {m.role === 'assistant' && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.8, pr: 0.5 }}>
                                        <CopyButton text={m.content} />
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    ))}


                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ px: 4, pt: 2, pb: 1.5, background: 'transparent' }}>
                    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                        {/* Main Input Container */}
                        <Box sx={{ 
                            background: '#f8fafc',
                            borderRadius: '24px',
                            border: '1px solid #e2e8f0',
                            px: 1,
                            pt: 0.5,
                            pb: 0.5,
                            mb: 1.5
                        }}>
                            <TextField
                                fullWidth
                                multiline
                                maxRows={4}
                                placeholder="Ask about tax sections, GST rules, TDS rates, audit compliance, or type your query..."
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                variant="standard"
                                InputProps={{ 
                                    disableUnderline: true,
                                    endAdornment: (
                                        <InputAdornment position="end" sx={{ mb: 0.5, mr: 0.5, alignSelf: 'flex-end' }}>
                                            <IconButton 
                                                onClick={handleSend} 
                                                disabled={loading || !input.trim()}
                                                sx={{ 
                                                    background: input.trim() ? '#eef2ff' : '#f1f5f9', 
                                                    color: input.trim() ? '#4f46e5' : '#94a3b8', 
                                                    borderRadius: '12px',
                                                    width: 38,
                                                    height: 38,
                                                    transition: 'all 0.2s ease',
                                                    '&:hover': { 
                                                        background: input.trim() ? '#e0e7ff' : '#e2e8f0'
                                                    },
                                                    '&:disabled': { background: '#f1f5f9', color: '#cbd5e1' }
                                                }}
                                            >
                                                <SendIcon sx={{ fontSize: 20 }} />
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{
                                    '& .MuiInputBase-root': {
                                        alignItems: 'flex-end',
                                    },
                                    '& .MuiInputBase-input': {
                                        fontSize: '0.95rem',
                                        color: '#334155',
                                        py: 1.5,
                                        pl: 2,
                                        '&::placeholder': { color: '#94a3b8', opacity: 0.8 }
                                    }
                                }}
                            />
                        </Box>

                        {/* Hint Text */}
                        <Typography sx={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', mt: 1, mb: 2, fontWeight: 500 }}>
                            <span style={{ color: '#64748b' }}>CA-GPT · Income Tax Act · GST · Companies Act · TDS · ICAI Standards</span> <span style={{ opacity: 0.5, margin: '0 4px' }}>|</span> Press Shift+Enter for new line
                        </Typography>

                        {/* Quick Actions - Only show on welcome screen */}
                        {isWelcomeScreen && (
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <Box 
                                    onClick={() => handleQuickAction(QUICK_ACTIONS[0].query)}
                                    sx={{ 
                                        background: '#ffffff',
                                        borderRadius: 3,
                                        border: '1px solid #e2e8f0',
                                        p: 2,
                                        width: 200,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                        '&:hover': { 
                                            transform: 'translateY(-2px)', 
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                            borderColor: '#c7d2fe'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#1e293b', mb: 0.5 }}>
                                        TDS on Salary
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                        Section 192 guidance and computation
                                    </Typography>
                                </Box>
                                <Box 
                                    onClick={() => handleQuickAction(QUICK_ACTIONS[1].query)}
                                    sx={{ 
                                        background: '#ffffff',
                                        borderRadius: 3,
                                        border: '1px solid #e2e8f0',
                                        p: 2,
                                        width: 200,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                        '&:hover': { 
                                            transform: 'translateY(-2px)', 
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                            borderColor: '#c7d2fe'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#1e293b', mb: 0.5 }}>
                                        Section 44AD
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                        Presumptive taxation scheme details
                                    </Typography>
                                </Box>
                                <Box 
                                    onClick={() => handleQuickAction(QUICK_ACTIONS[2].query)}
                                    sx={{ 
                                        background: '#ffffff',
                                        borderRadius: 3,
                                        border: '1px solid #e2e8f0',
                                        p: 2,
                                        width: 200,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                                        '&:hover': { 
                                            transform: 'translateY(-2px)', 
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                            borderColor: '#c7d2fe'
                                        }
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight="600" sx={{ color: '#1e293b', mb: 0.5 }}>
                                        GST ITC Rules
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                        Input Tax Credit conditions
                                    </Typography>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Paper>


            {/* Draft Modal */}
            <Dialog open={draftModalOpen} onClose={() => setDraftModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, pb: 1, color: '#1e1b4b' }}>
                    ✍️ Generate Professional Draft
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        The AI will generate a complete, legally structured document with all citations.
                    </Typography>
                    <TextField 
                        label="Document Type" 
                        fullWidth margin="normal" select
                        SelectProps={{ native: true }}
                        value={draftType} onChange={(e) => setDraftType(e.target.value)}
                        sx={{ '& select': { py: 1.5 } }}
                    >
                        <option value="Notice Reply">Income Tax Notice Reply</option>
                        <option value="GST Notice Reply">GST Notice Reply</option>
                        <option value="Representation Letter">Representation Letter</option>
                        <option value="Audit Report Cover Letter">Audit Report Cover Letter</option>
                        <option value="Appeal Memo">Appeal Memo (CIT(A))</option>
                        <option value="Form 35 Statement of Facts">Statement of Facts (Form 35)</option>
                        <option value="Legal Opinion">Tax Legal Opinion</option>
                        <option value="Compliance Certificate">Compliance Certificate</option>
                    </TextField>
                    <TextField 
                        label="Subject / Notice Reference" 
                        fullWidth margin="normal" 
                        value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)}
                        placeholder="e.g. Reply to Section 143(2) scrutiny notice DIN 2024/..."
                    />
                    <TextField 
                        label="Key Facts & Client Details" 
                        fullWidth margin="normal" multiline rows={4}
                        value={draftDetails} onChange={(e) => setDraftDetails(e.target.value)}
                        placeholder="e.g. Client received notice for AY 2023-24. Cash deposits of ₹8 Lakhs were from prior savings and sale of agricultural land (exempt). Client is individual, ITR-2 filed..."
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <Button onClick={() => setDraftModalOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
                    <Button 
                        variant="contained" onClick={handleGenerateDraft}
                        sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' }}
                    >
                        Generate Draft
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Knowledge Base Upload Modal */}
            <Dialog open={kbModalOpen} onClose={() => setKbModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ fontWeight: 800, color: '#1e1b4b' }}>📚 Add to Firm Knowledge Base</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
                        Uploaded documents are embedded and retrieved automatically when you ask related questions.
                    </Typography>
                    <Tabs value={kbTab} onChange={(_, v) => setKbTab(v)} sx={{ mb: 2 }}>
                        <Tab label="Upload Document (PDF/Image)" />
                        <Tab label="Paste Note / Circular" />
                    </Tabs>

                    {kbTab === 0 ? (
                        <Box sx={{ mt: 2, textAlign: 'center', p: 4, border: '2px dashed #c7d2fe', borderRadius: 3, background: '#fafbff' }}>
                            <UploadFile sx={{ fontSize: 40, color: '#818cf8', mb: 1 }} />
                            <Typography gutterBottom fontWeight={600} color="#3730a3">Upload Circulars, Rulings, or Client Docs</Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 2 }}>
                                Supports PDF and images. Text will be extracted via OCR and embedded.
                            </Typography>
                            <Button variant="outlined" component="label" disabled={uploading} sx={{ borderRadius: 2, borderColor: '#818cf8', color: '#4f46e5' }}>
                                {uploading ? 'Processing...' : 'Select File'}
                                <input type="file" hidden onChange={handleUploadKB} accept=".pdf,.png,.jpg,.jpeg" />
                            </Button>
                        </Box>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <TextField 
                                label="Note Title" 
                                fullWidth margin="normal" 
                                value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                                placeholder="e.g. CBDT Circular No. 2/2024 — TDS on Salary"
                            />
                            <TextField 
                                label="Content / Circular Text" 
                                fullWidth margin="normal" multiline rows={5}
                                value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                                placeholder="Paste the full text of the notification, ruling, or internal note..."
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5, gap: 1 }}>
                    <Button onClick={() => setKbModalOpen(false)} sx={{ borderRadius: 2 }}>Close</Button>
                    {kbTab === 1 && <Button variant="contained" onClick={handleSaveNote} disabled={uploading} sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>Save to Knowledge Base</Button>}
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default CAAssistant;
