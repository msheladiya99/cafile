import React, { useRef, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    IconButton,
    Avatar,
    Stack,
    CircularProgress
} from '@mui/material';
import { Send as SendIcon, AttachFile as AttachIcon } from '@mui/icons-material';
import { type IMessage } from '../services/messageService';

interface ChatInterfaceProps {
    messages: IMessage[];
    currentUserRole: string; // 'CLIENT' or 'ADMIN'/'STAFF'
    onSendMessage: (message: string) => Promise<void>;
    loading?: boolean;
    sending?: boolean;
    title?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    currentUserRole,
    onSendMessage,
    loading = false,
    sending = false,
    title = 'Messages'
}) => {
    const [newMessage, setNewMessage] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;

        await onSendMessage(newMessage);
        setNewMessage('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Group messages by date
    const groupedMessages: { [key: string]: IMessage[] } = {};
    messages.forEach(msg => {
        const dateKey = formatDate(msg.createdAt);
        if (!groupedMessages[dateKey]) groupedMessages[dateKey] = [];
        groupedMessages[dateKey].push(msg);
    });

    return (
        <Paper
            sx={{
                height: 'calc(100vh - 200px)',
                minHeight: '500px',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6" fontWeight="600">{title}</Typography>
            </Box>

            {/* Messages Area */}
            <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', bgcolor: '#f5f7fa' }}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                        <CircularProgress />
                    </Box>
                ) : messages.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column">
                        <Typography variant="body1" color="text.secondary">No messages yet.</Typography>
                        <Typography variant="body2" color="text.secondary">Start a conversation!</Typography>
                    </Box>
                ) : (
                    Object.keys(groupedMessages).map(date => (
                        <Box key={date} sx={{ mb: 2 }}>
                            <Box display="flex" justifyContent="center" mb={2}>
                                <Typography variant="caption" sx={{ bgcolor: 'rgba(0,0,0,0.05)', px: 1.5, py: 0.5, borderRadius: 10 }}>
                                    {date}
                                </Typography>
                            </Box>

                            {groupedMessages[date].map(msg => {
                                // Determine if this message is from current user
                                const isMe = (currentUserRole === 'CLIENT' && msg.senderId.role === 'CLIENT') ||
                                    (currentUserRole !== 'CLIENT' && msg.senderId.role !== 'CLIENT');

                                return (
                                    <Box
                                        key={msg._id}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: isMe ? 'flex-end' : 'flex-start',
                                            mb: 1.5
                                        }}
                                    >
                                        {!isMe && (
                                            <Avatar
                                                sx={{ width: 32, height: 32, mr: 1, bgcolor: isMe ? 'primary.main' : 'secondary.main', fontSize: 14 }}
                                            >
                                                {msg.senderId.role === 'CLIENT' ? 'C' : 'CA'}
                                            </Avatar>
                                        )}

                                        <Box
                                            sx={{
                                                maxWidth: '70%',
                                                bgcolor: isMe ? 'primary.main' : 'white',
                                                color: isMe ? 'white' : 'text.primary',
                                                p: 2,
                                                borderRadius: 2,
                                                boxShadow: 1,
                                                borderTopLeftRadius: !isMe ? 0 : 2,
                                                borderTopRightRadius: isMe ? 0 : 2
                                            }}
                                        >
                                            {!isMe && (
                                                <Typography variant="caption" display="block" fontWeight="bold" sx={{ mb: 0.5, color: isMe ? 'inherit' : 'primary.main' }}>
                                                    {msg.senderId.username}
                                                </Typography>
                                            )}
                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                                {msg.message}
                                            </Typography>
                                            <Box display="flex" justifyContent="flex-end" mt={0.5}>
                                                <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                                                    {formatTime(msg.createdAt)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    ))
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Input Area */}
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton size="small">
                        <AttachIcon />
                    </IconButton>
                    <TextField
                        fullWidth
                        placeholder="Type a message..."
                        size="small"
                        variant="outlined"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 4,
                                bgcolor: '#f8f9fa'
                            }
                        }}
                    />
                    <IconButton
                        color="primary"
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.main' } }}
                    >
                        {sending ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                    </IconButton>
                </Stack>
            </Box>
        </Paper>
    );
};
