import React from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface FAQ {
    q: string;
    a: string;
}

interface FAQAccordionProps {
    faqs: FAQ[];
}

export const FAQAccordion: React.FC<FAQAccordionProps> = ({ faqs }) => {
    return (
        <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto' }}>
            {faqs.map((faq, index) => (
                <Accordion
                    key={index}
                    sx={{
                        mb: 2,
                        borderRadius: '16px !important',
                        '&:before': { display: 'none' },
                        border: '1px solid #e2e8f0',
                        boxShadow: 'none',
                        '&.Mui-expanded': { border: '1px solid #6366f1', boxShadow: '0 10px 30px rgba(99,102,241,0.05)' },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#6366f1' }} />}
                        sx={{ px: { xs: 3, md: 4 }, py: 1 }}
                        id={`faq-header-${index}`}
                        aria-controls={`faq-content-${index}`}
                    >
                        <Typography variant="h6" sx={{ color: '#1e293b', fontWeight: 800, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                            {faq.q}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails id={`faq-content-${index}`} sx={{ px: { xs: 3, md: 4 }, pb: 3, pt: 0 }}>
                        <Typography variant="body1" sx={{ color: '#64748b', lineHeight: 1.8, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                            {faq.a}
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            ))}
        </Box>
    );
};
