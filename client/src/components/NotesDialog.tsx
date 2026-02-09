import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
} from '@mui/material';

interface NotesDialogProps {
    open: boolean;
    onClose: () => void;
    currentNotes: string;
    fileName: string;
    onSave: (notes: string) => void;
}

export const NotesDialog: React.FC<NotesDialogProps> = ({
    open,
    onClose,
    currentNotes,
    fileName,
    onSave,
}) => {
    const [notes, setNotes] = useState(currentNotes);

    const handleSave = () => {
        onSave(notes);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add Notes</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    File: <strong>{fileName}</strong>
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Internal Notes"
                    placeholder="Add internal notes about this file (visible only to staff)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    helperText="These notes are for internal use only and not visible to clients"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                    }}
                >
                    Save Notes
                </Button>
            </DialogActions>
        </Dialog>
    );
};
