import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    CircularProgress,
    Typography,
    Button,
} from '@mui/material';
import {
    Close as CloseIcon,
    ZoomIn as ZoomInIcon,
    ZoomOut as ZoomOutIcon,
    Download as DownloadIcon,
} from '@mui/icons-material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker - Use local worker file (no CORS issues!)
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface PDFPreviewProps {
    open: boolean;
    onClose: () => void;
    fileUrl: string;
    fileName: string;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
    open,
    onClose,
    fileUrl,
    fileName,
}) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');
    const [pdfBlob, setPdfBlob] = useState<string | null>(null);

    // Fetch PDF with authentication
    React.useEffect(() => {
        if (open && fileUrl) {
            setLoading(true);
            setError('');
            setPdfBlob(null);

            const token = localStorage.getItem('token');

            console.log('Fetching PDF from:', fileUrl);
            console.log('Auth token present:', !!token);

            fetch(fileUrl, {
                headers: token ? {
                    'Authorization': `Bearer ${token}`
                } : {}
            })
                .then(response => {
                    console.log('PDF fetch response status:', response.status);
                    console.log('PDF fetch response ok:', response.ok);
                    console.log('PDF content-type:', response.headers.get('content-type'));

                    if (!response.ok) {
                        throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    console.log('PDF blob size:', blob.size);
                    console.log('PDF blob type:', blob.type);

                    const url = URL.createObjectURL(blob);
                    console.log('PDF object URL created:', url);
                    setPdfBlob(url);
                })
                .catch(err => {
                    console.error('Error fetching PDF:', err);
                    console.error('Error details:', err.message);
                    setError(`Failed to load PDF: ${err.message}. Please try downloading the file instead.`);
                    setLoading(false);
                });
        }

        return () => {
            if (pdfBlob) {
                console.log('Revoking PDF object URL');
                URL.revokeObjectURL(pdfBlob);
            }
        };
    }, [open, fileUrl]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
        setError('');
    };

    const onDocumentLoadError = (error: Error) => {
        console.error('Error loading PDF:', error);
        setLoading(false);
        setError('Failed to load PDF. Please try downloading the file instead.');
    };

    const handleZoomIn = () => {
        setScale((prev) => Math.min(prev + 0.2, 2.0));
    };

    const handleZoomOut = () => {
        setScale((prev) => Math.max(prev - 0.2, 0.5));
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.click();
    };

    const goToPrevPage = () => {
        setPageNumber((prev) => Math.max(prev - 1, 1));
    };

    const goToNextPage = () => {
        setPageNumber((prev) => Math.min(prev + 1, numPages));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: {
                    height: '90vh',
                    maxHeight: '90vh',
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: 2,
                }}
            >
                <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    📄 {fileName}
                </Typography>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: '#f5f5f5',
                }}
            >
                <Button
                    variant="outlined"
                    size="small"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                >
                    Previous
                </Button>

                <Typography variant="body2">
                    Page {pageNumber} of {numPages || '?'}
                </Typography>

                <Button
                    variant="outlined"
                    size="small"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                >
                    Next
                </Button>

                <Box sx={{ borderLeft: '1px solid #ccc', height: 30, mx: 1 }} />

                <IconButton onClick={handleZoomOut} disabled={scale <= 0.5} size="small">
                    <ZoomOutIcon />
                </IconButton>

                <Typography variant="body2">{Math.round(scale * 100)}%</Typography>

                <IconButton onClick={handleZoomIn} disabled={scale >= 2.0} size="small">
                    <ZoomInIcon />
                </IconButton>

                <Box sx={{ borderLeft: '1px solid #ccc', height: 30, mx: 1 }} />

                <Button
                    variant="contained"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        textTransform: 'none',
                    }}
                >
                    Download
                </Button>
            </Box>

            <DialogContent
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                    overflow: 'auto',
                    backgroundColor: '#525659',
                    p: 3,
                }}
            >
                {loading && !error && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            mt: 10,
                        }}
                    >
                        <CircularProgress sx={{ color: 'white' }} />
                        <Typography sx={{ color: 'white' }}>Loading PDF...</Typography>
                    </Box>
                )}

                {error && (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            mt: 10,
                        }}
                    >
                        <Typography sx={{ color: 'white', textAlign: 'center' }}>
                            {error}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleDownload}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                        >
                            Download File Instead
                        </Button>
                    </Box>
                )}

                {!error && pdfBlob && (
                    <Document
                        file={pdfBlob}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        loading={null}
                        options={{
                            cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                            cMapPacked: true,
                        }}
                    >
                        <Page
                            pageNumber={pageNumber}
                            scale={scale}
                            renderTextLayer={true}
                            renderAnnotationLayer={true}
                        />
                    </Document>
                )}
            </DialogContent>
        </Dialog>
    );
};
