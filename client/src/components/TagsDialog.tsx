import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Chip,
    Typography,
    Autocomplete,
} from '@mui/material';

interface TagsDialogProps {
    open: boolean;
    onClose: () => void;
    currentTags: string[];
    availableTags: string[];
    onSave: (tags: string[]) => void;
}

export const TagsDialog: React.FC<TagsDialogProps> = ({
    open,
    onClose,
    currentTags,
    availableTags,
    onSave,
}) => {
    const [tags, setTags] = useState<string[]>(currentTags);

    const handleSave = () => {
        onSave(tags);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Manage Tags</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Add custom tags to organize and categorize your files
                </Typography>
                <Autocomplete
                    multiple
                    freeSolo
                    options={availableTags}
                    value={tags}
                    onChange={(_, newValue) => setTags(newValue)}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                            <Chip
                                label={option}
                                {...getTagProps({ index })}
                                sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                }}
                            />
                        ))
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Tags"
                            placeholder="Type and press Enter to add tags"
                            helperText="Examples: urgent, pending-signature, reviewed, important"
                        />
                    )}
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
                    Save Tags
                </Button>
            </DialogActions>
        </Dialog>
    );
};
