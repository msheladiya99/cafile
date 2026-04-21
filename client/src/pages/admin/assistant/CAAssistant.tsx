import React, { useState, useEffect, useRef } from 'react';
import { 
    Box, Paper, Typography, TextField, Button, IconButton, 
    List, ListItem, ListItemButton, ListItemText, Divider, ListItemIcon,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab, Chip, Tooltip
} from '@mui/material';
import { 
    Send as SendIcon, AutoAwesome, UploadFile,
    Add as AddIcon, ChatBubbleOutline, ContentCopy, Check,
    Gavel, Calculate, ReceiptLong, AccountBalance, Description
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
                    fetchHistory();
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

    return (
        <Box sx={{ 
            display: 'flex', 
            height: 'calc(100vh - 70px)', 
            width: '100%',
            gap: 0, 
            p: 0, 
            overflow: 'hidden',
            margin: '-24px', 
            background: '#ffffff'
        }}>
            
            {/* Sidebar */}
            <Paper elevation={0} sx={{ 
                width: 320, 
                flexShrink: 0,
                borderRadius: 0, // No rounding for full page
                borderRight: '1px solid rgba(0,0,0,0.08)', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'hidden',
                background: '#f8fafc',
            }}>
                <Box sx={{ p: 3, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white' }}>
                    <Typography variant="h6" fontWeight="800" display="flex" alignItems="center" gap={1.5} sx={{ letterSpacing: '-0.5px' }}>
                        <AutoAwesome sx={{ fontSize: 22 }} /> CA-Assistant
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.85, mt: 0.5, display: 'block', fontWeight: 500 }}>
                        Elite Tax & Compliance AI
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
                            fontWeight: 700,
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
                            sx={{ borderRadius: 2, py: 1, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderColor: '#c7d2fe', color: '#4f46e5', '&:hover': { borderColor: '#818cf8', background: '#eef2ff' } }}
                        >
                            Draft Letter
                        </Button>
                        <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth 
                            onClick={() => setKbModalOpen(true)} 
                            sx={{ borderRadius: 2, py: 1, fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', borderColor: '#c7d2fe', color: '#4f46e5', '&:hover': { borderColor: '#818cf8', background: '#eef2ff' } }}
                        >
                            Knowledge
                        </Button>
                    </Box>
                </Box>

                <Divider sx={{ opacity: 0.6 }} />

                <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1, py: 2 }}>
                    <Typography variant="caption" sx={{ px: 2, mb: 1, display: 'block', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
                                            background: '#eef2ff',
                                            '&:hover': { background: '#e0e7ff' }
                                        } 
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32 }}><ChatBubbleOutline sx={{ fontSize: 16 }} color={activeChatId === c._id ? "primary" : "inherit"} /></ListItemIcon>
                                    <ListItemText 
                                        primary={c.title} 
                                        primaryTypographyProps={{ fontSize: '0.78rem', fontWeight: activeChatId === c._id ? 700 : 500, noWrap: true, color: activeChatId === c._id ? '#3730a3' : '#475569' }} 
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
                borderRadius: 0, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden',
                background: '#ffffff'
            }}>
                
                {/* Messages Container */}
                <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    p: { xs: 2, md: 3 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: isWelcomeScreen ? 0 : 2.5, 
                    background: '#fafbff',
                    '&::-webkit-scrollbar': { width: '5px' },
                    '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: '10px' }
                }}>
                    {/* Welcome / Empty State */}
                    {isWelcomeScreen && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', px: 3 }}>
                            <Box sx={{ 
                                width: 72, height: 72, borderRadius: '20px', 
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                mb: 2.5, boxShadow: '0 12px 32px rgba(79,70,229,0.25)'
                            }}>
                                <AutoAwesome sx={{ fontSize: 36, color: 'white' }} />
                            </Box>
                            <Typography variant="h5" fontWeight="800" sx={{ color: '#1e1b4b', mb: 1, letterSpacing: '-0.5px' }}>
                                CA-GPT — Your Expert Tax Advisor
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', mb: 4, maxWidth: 480, lineHeight: 1.7 }}>
                                Powered by deep knowledge of the Income Tax Act, GST, Companies Act, and ICAI standards.
                                Ask any tax or compliance question and get structured, section-cited answers.
                            </Typography>
                            
                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', mb: 2 }}>
                                Try a Quick Query
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', maxWidth: 640 }}>
                                {QUICK_ACTIONS.map((action, i) => (
                                    <Chip
                                        key={i}
                                        icon={action.icon}
                                        label={action.label}
                                        onClick={() => handleQuickAction(action.query)}
                                        clickable
                                        sx={{
                                            background: '#ffffff',
                                            border: '1px solid #e0e7ff',
                                            color: '#4338ca',
                                            fontWeight: 600,
                                            fontSize: '0.78rem',
                                            px: 0.5,
                                            py: 2.5,
                                            borderRadius: 3,
                                            boxShadow: '0 2px 8px rgba(79,70,229,0.08)',
                                            '&:hover': { background: '#eef2ff', borderColor: '#818cf8', transform: 'translateY(-2px)', boxShadow: '0 6px 16px rgba(79,70,229,0.15)' },
                                            transition: 'all 0.2s ease',
                                            '& .MuiChip-icon': { color: '#6366f1' }
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    )}

                    {/* Messages */}
                    {messages.map((m, idx) => (
                        <Box key={idx} sx={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 1 }}>
                            {/* AI Avatar */}
                            {m.role === 'assistant' && (
                                <Box sx={{ 
                                    width: 32, height: 32, borderRadius: '10px', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    mt: 0.5
                                }}>
                                    <AutoAwesome sx={{ fontSize: 16, color: 'white' }} />
                                </Box>
                            )}
                            <Box sx={{ maxWidth: '92%' }}>
                                <Box sx={{ 
                                    p: m.role === 'user' ? 2 : 3, 
                                    borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '4px 20px 20px 24px',
                                    background: m.role === 'user' 
                                        ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' 
                                        : '#ffffff',
                                    color: m.role === 'user' ? '#ffffff' : '#1e293b',
                                    boxShadow: m.role === 'user' 
                                        ? '0 8px 20px rgba(79, 70, 229, 0.25)' 
                                        : '0 2px 12px rgba(0,0,0,0.06)',
                                    border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                                    '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 }, lineHeight: 1.75 },
                                    '& ul, & ol': { mt: 0, pl: 2.5, mb: 1 },
                                    '& li': { mb: 0.5, lineHeight: 1.7 },
                                    '& strong': { fontWeight: 700, color: m.role === 'user' ? '#fff' : '#1e1b4b' },
                                    '& h2': { fontSize: '1rem', fontWeight: 800, color: '#1e1b4b', mb: 0.5, mt: 1.5, borderBottom: '2px solid #e0e7ff', pb: 0.5 },
                                    '& h3': { fontSize: '0.9rem', fontWeight: 700, color: '#3730a3', mb: 0.5, mt: 1 },
                                    '& table': { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', mt: 1, mb: 1 },
                                    '& th': { background: '#eef2ff', p: '6px 10px', textAlign: 'left', fontWeight: 700, border: '1px solid #c7d2fe', color: '#3730a3' },
                                    '& td': { p: '5px 10px', border: '1px solid #e0e7ff', color: '#334155' },
                                    '& code': { background: '#f1f5f9', px: 0.8, py: 0.2, borderRadius: 1, fontSize: '0.82rem', fontFamily: 'monospace', color: '#7c3aed' },
                                    '& pre': { background: '#1e293b', p: 2, borderRadius: 2, overflow: 'auto', color: '#e2e8f0', fontSize: '0.82rem' },
                                    '& blockquote': { borderLeft: '3px solid #818cf8', pl: 2, ml: 0, color: '#64748b', fontStyle: 'italic' },
                                    '& hr': { border: 'none', borderTop: '1px solid #e2e8f0', my: 1.5 },
                                }}>
                                    {m.role === 'assistant' ? (
                                        <ReactMarkdown>{m.content}</ReactMarkdown>
                                    ) : (
                                        <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{m.content}</Typography>
                                    )}
                                </Box>
                                {/* Copy button for assistant messages */}
                                {m.role === 'assistant' && (
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5, pr: 1 }}>
                                        <CopyButton text={m.content} />
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    ))}

                    {/* Loading Indicator */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ 
                                width: 32, height: 32, borderRadius: '10px', flexShrink: 0,
                                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <AutoAwesome sx={{ fontSize: 16, color: 'white' }} />
                            </Box>
                            <Box sx={{ p: 2, px: 2.5, borderRadius: '4px 20px 20px 20px', background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', gap: 1.5, alignItems: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                                <CircularProgress size={14} thickness={6} sx={{ color: '#6366f1' }} />
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    Analysing...
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                {/* Input Area */}
                <Box sx={{ p: 2.5, background: '#ffffff', borderTop: '1px solid #f1f5f9' }}>
                    <Box sx={{ position: 'relative' }}>
                        <TextField
                            fullWidth
                            multiline
                            maxRows={5}
                            placeholder="Ask about tax sections, GST rules, TDS rates, audit compliance, or type your query..."
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
                                    borderRadius: '16px',
                                    pr: 7,
                                    background: '#f8faff',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.9rem',
                                    '& fieldset': { borderColor: '#e0e7ff' },
                                    '&:hover fieldset': { borderColor: '#a5b4fc' },
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
                                background: input.trim() ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e2e8f0', 
                                color: '#fff', 
                                borderRadius: '12px',
                                width: 42,
                                height: 42,
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { transform: 'scale(1.08)', boxShadow: '0 4px 12px rgba(79,70,229,0.35)' },
                                '&:disabled': { background: '#f1f5f9', color: '#94a3b8' }
                            }}
                        >
                            <SendIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1.5, display: 'block', textAlign: 'center', color: '#94a3b8', fontWeight: 500 }}>
                        CA-GPT · Income Tax Act · GST · Companies Act · TDS · ICAI Standards &nbsp;|&nbsp; Press Shift+Enter for new line
                    </Typography>
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
