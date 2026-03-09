const fs = require('fs');
const path = require('path');

function processFile(fileInfo) {
    const { filePath, title, showListIcon, listIconComponent, filterIconComponent } = fileInfo;
    let content = fs.readFileSync(filePath, 'utf8');

    // Skip if already has SectionProps
    if (content.includes('interface SectionProps')) {
        console.log(`Skipping ${path.basename(filePath)} (already updated)`);
        return;
    }

    const sectionComponent = `
// Reusable UI components
interface SectionProps {
    title: string;
    icon: React.ReactElement<{ sx?: Record<string, unknown> }>;
    children?: React.ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => (
    <Paper elevation={0} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ bgcolor: '#f8fafc', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            {React.cloneElement(icon, { sx: { width: 20, height: 20, color: 'text.secondary' } })}
            <Typography variant="subtitle2" fontWeight="700" color="text.primary" sx={{ fontSize: '0.9rem' }}>{title}</Typography>
        </Box>
        <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
            {children}
        </Box>
    </Paper>
);
`;

    // 1. Add Section definition
    content = content.replace(/export const \w+: React\.FC.*? =.*? => \{/g, (match) => {
        return sectionComponent + '\n' + match;
    });

    // 2. Wrap return (best effort)
    // Find the outmost <Box
    // We'll replace the first return <Box sx={{...}}> with the structured outer shell
    const headerRegex = /{\/\* Header.*? \*\//;
    // ... Actually, regex matching of entire JSX block might fail. So let's write a simple AST or robust regex.
}
