import { Fab, Tooltip, Zoom } from '@mui/material';
import { WhatsApp as WhatsAppIcon } from '@mui/icons-material';

/**
 * Floating WhatsApp Support Button
 */
const WhatsAppButton = () => {
    const phoneNumber = '919537994439';
    const message = encodeURIComponent("Hello! I'm interested in My CA File software. Can I get more details?");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <Zoom in={true}>
            <Tooltip title="Chat on WhatsApp" placement="left" arrow>
                <Fab
                    color="success"
                    aria-label="whatsapp"
                    onClick={() => window.open(whatsappUrl, '_blank')}
                    sx={{
                        position: 'fixed',
                        bottom: { xs: 24, md: 32 },
                        right: { xs: 24, md: 32 },
                        bgcolor: '#25D366',
                        '&:hover': {
                            bgcolor: '#128C7E',
                            transform: 'scale(1.1) rotate(5deg)',
                        },
                        boxShadow: '0 8px 32px rgba(37, 211, 102, 0.4)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        zIndex: 1000,
                    }}
                >
                    <WhatsAppIcon sx={{ fontSize: 32 }} />
                </Fab>
            </Tooltip>
        </Zoom>
    );
};

export default WhatsAppButton;
