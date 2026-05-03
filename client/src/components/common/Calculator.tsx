import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, IconButton, Stack, Tooltip } from '@mui/material';
import { Close as CloseIcon, HistoryToggleOff as HistoryIcon, DeleteSweep as DeleteIcon } from '@mui/icons-material';

// ── Colors (Light Theme) ─────────────────────────────────────────────────────
const BG       = '#f0f0f0';     // overall background
const BG_HIST  = '#e5e5e5';     // history panel
const BTN_NUM  = '#ffffff';     // digit buttons
const BTN_FUNC = '#d4d4d4';     // function / memory buttons
const BTN_OP   = '#ff9500';     // operator buttons (orange)
const TEXT_NUM  = '#1c1c1e';
const TEXT_FUNC = '#1c1c1e';
const TEXT_OP   = '#ffffff';

interface HistoryItem { expr: string; result: string; }

type BtnDef = { label: string; color: string; textColor: string };

const ROW = (btns: BtnDef[]) => btns;

const ROWS: BtnDef[][] = [
  ROW([
    { label: 'AC', color: BTN_FUNC, textColor: '#ff3b30' },
    { label: '+/-', color: BTN_FUNC, textColor: TEXT_FUNC },
    { label: '%', color: BTN_FUNC, textColor: TEXT_FUNC },
    { label: '÷', color: BTN_OP, textColor: TEXT_OP },
  ]),
  ROW([
    { label: '7', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '8', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '9', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '×', color: BTN_OP, textColor: TEXT_OP },
  ]),
  ROW([
    { label: '4', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '5', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '6', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '−', color: BTN_OP, textColor: TEXT_OP },
  ]),
  ROW([
    { label: '1', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '2', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '3', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '+', color: BTN_OP, textColor: TEXT_OP },
  ]),
  ROW([
    { label: 'Rand', color: BTN_FUNC, textColor: TEXT_FUNC },
    { label: '0', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '.', color: BTN_NUM, textColor: TEXT_NUM },
    { label: '=', color: BTN_OP, textColor: TEXT_OP },
  ]),
];

const factorial = (n: number): number => n <= 1 ? 1 : n * factorial(n - 1);

export const Calculator: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [justEvaled, setJustEvaled] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [activeBtn, setActiveBtn] = useState<string | null>(null);
  const [memory, setMemory] = useState(0);

  const dragRef = useRef<{ startX: number; startY: number; initL: number; initT: number } | null>(null);
  const [position, setPosition] = useState({ left: window.innerWidth - 380, top: 120 });
  const boxRef  = useRef<HTMLDivElement>(null);

  // ── Button logic ──────────────────────────────────────────────────────────
  const handleBtn = useCallback((label: string) => {
    setActiveBtn(label);
    setTimeout(() => setActiveBtn(null), 120);

    const val = parseFloat(display);

    switch (label) {
      case 'AC':       setDisplay('0'); setExpression(''); setJustEvaled(false); break;
      case '+/-':      setDisplay(d => d.startsWith('-') ? d.slice(1) : '-' + d); break;
      case '%':        setDisplay(d => String(parseFloat(d) / 100)); break;
      
      // Memory
      case 'mc': setMemory(0); break;
      case 'm+': setMemory(m => m + val); break;
      case 'm-': setMemory(m => m - val); break;
      case 'mr': setDisplay(String(memory)); setJustEvaled(true); break;

      case '=': {
        try {
          const expr = expression + display;
          const cleaned = expr.replace(/÷/g,'/')
            .replace(/×/g,'*').replace(/−/g,'-')
            .replace(/π/g, String(Math.PI)).replace(/e(?!\^)/g, String(Math.E));
          const result = String(new Function('return ' + cleaned)());
          setHistory(h => [{ expr, result }, ...h].slice(0, 30));
          setDisplay(result); setExpression(''); setJustEvaled(true);
        } catch { setDisplay('Error'); setExpression(''); }
        break;
      }

      case '÷': case '×': case '+': case '−':
        setExpression(expression + display + ' ' + label + ' ');
        setDisplay('0'); setJustEvaled(false); break;
      
      case '(':  case ')': setExpression(e => e + display + label); setDisplay('0'); break;
      case 'π':  setDisplay(String(Math.PI)); setJustEvaled(true); break;
      case 'e':  setDisplay(String(Math.E)); setJustEvaled(true); break;
      case 'Rand': setDisplay(String(Math.random().toFixed(6))); setJustEvaled(true); break;
      
      case 'x²':  setDisplay(d => String(Math.pow(parseFloat(d), 2))); setJustEvaled(true); break;
      case 'x³':  setDisplay(d => String(Math.pow(parseFloat(d), 3))); setJustEvaled(true); break;
      case '¹/x': setDisplay(d => String(1/parseFloat(d))); setJustEvaled(true); break;
      case '²√x': setDisplay(d => String(Math.sqrt(parseFloat(d)))); setJustEvaled(true); break;
      case '³√x': setDisplay(d => String(Math.cbrt(parseFloat(d)))); setJustEvaled(true); break;
      case 'ln':  setDisplay(d => String(Math.log(parseFloat(d)))); setJustEvaled(true); break;
      case 'log₁₀': setDisplay(d => String(Math.log10(parseFloat(d)))); setJustEvaled(true); break;
      case 'sin': setDisplay(d => String(Math.sin(parseFloat(d)))); setJustEvaled(true); break;
      case 'cos': setDisplay(d => String(Math.cos(parseFloat(d)))); setJustEvaled(true); break;
      case 'tan': setDisplay(d => String(Math.tan(parseFloat(d)))); setJustEvaled(true); break;
      case 'sinh': setDisplay(d => String(Math.sinh(parseFloat(d)))); setJustEvaled(true); break;
      case 'cosh': setDisplay(d => String(Math.cosh(parseFloat(d)))); setJustEvaled(true); break;
      case 'tanh': setDisplay(d => String(Math.tanh(parseFloat(d)))); setJustEvaled(true); break;
      case 'x!': setDisplay(d => String(factorial(Math.floor(parseFloat(d))))); setJustEvaled(true); break;
      case 'eˣ': setDisplay(d => String(Math.exp(parseFloat(d)))); setJustEvaled(true); break;
      case '10ˣ': setDisplay(d => String(Math.pow(10,parseFloat(d)))); setJustEvaled(true); break;
      
      case 'xʸ': setExpression(expression + display + ' ** '); setDisplay('0'); break;
      case 'ʸ√x': setExpression(expression + display + ' ** (1/'); setDisplay('0'); break;
      case 'EE': setDisplay(d => d + 'e'); break;

      case '⊞': setShowHistory(s => !s); break;
      case '.': setDisplay(d => d.includes('.') ? d : d + '.'); break;
      
      default:
        if (justEvaled) { setDisplay(label); setJustEvaled(false); }
        else setDisplay(d => d === '0' ? label : d + label);
    }
  }, [display, expression, justEvaled, memory]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { onClose(); return; }
      if ('0123456789'.includes(e.key)) handleBtn(e.key);
      if (e.key === '+') handleBtn('+');
      if (e.key === '-') handleBtn('−');
      if (e.key === '*') handleBtn('×');
      if (e.key === '/') { e.preventDefault(); handleBtn('÷'); }
      if (e.key === '.') handleBtn('.');
      if (e.key === '%') handleBtn('%');
      if (e.key === 'Enter' || e.key === '=') handleBtn('=');
      if (e.key === 'Backspace') setDisplay(d => d.length > 1 ? d.slice(0,-1) : '0');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleBtn, onClose]);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, initL: position.left, initT: position.top };
    const move = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPosition({
        left: dragRef.current.initL + ev.clientX - dragRef.current.startX,
        top:  dragRef.current.initT + ev.clientY - dragRef.current.startY
      });
    };
    const up = () => { dragRef.current = null; window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;

  const fontSize = display.length > 14 ? '1.6rem' : display.length > 10 ? '2.2rem' : display.length > 7 ? '2.8rem' : '3.8rem';

  return (
    <Box ref={boxRef} sx={{
      position: 'fixed', left: position.left, top: position.top, zIndex: 9999,
      display: 'flex', borderRadius: '20px', overflow: 'hidden',
      boxShadow: '0 40px 100px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.15)',
      border: '1px solid rgba(0,0,0,0.08)',
      userSelect: 'none',
    }}>

      {/* ── History Panel ─────────────────────────────────────────────── */}
      {showHistory && (
        <Box sx={{ width: 210, bgcolor: BG_HIST, display: 'flex', flexDirection: 'column', overflowY: 'auto', maxHeight: 540, borderRight: '1px solid rgba(0,0,0,0.05)' }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography fontSize="0.7rem" fontWeight={900} color="#999" sx={{ letterSpacing: 1.2 }}>HISTORY</Typography>
            <Stack direction="row" spacing={0.2}>
              {history.length > 0 && (
                <Tooltip title="Clear History">
                  <IconButton size="small" onClick={() => setHistory([])} sx={{ color: '#aaa', '&:hover': { color: '#ef4444' } }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              )}
              <IconButton size="small" onClick={() => setShowHistory(false)} sx={{ color: '#aaa' }}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
          </Box>
          {history.length === 0
            ? (
              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, opacity: 0.4 }}>
                <HistoryIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography fontSize="0.75rem" fontWeight={600}>No History</Typography>
              </Box>
            )
            : history.map((h, i) => (
              <Box key={i} onClick={() => { setDisplay(h.result); setJustEvaled(true); }}
                sx={{ px: 2.5, py: 1.2, cursor: 'pointer', borderBottom: '1px solid rgba(0,0,0,0.05)', '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' } }}>
                <Typography fontSize="0.65rem" color="#999" noWrap>{h.expr}</Typography>
                <Typography fontSize="1.1rem" fontWeight={700} color="#1c1c1e" noWrap>{h.result}</Typography>
              </Box>
            ))
          }
        </Box>
      )}

      {/* ── Calculator Body ───────────────────────────────────────────── */}
      <Box sx={{ width: 320, bgcolor: BG, display: 'flex', flexDirection: 'column' }}>

        {/* Display */}
        <Box onMouseDown={startDrag} sx={{ px: 3, pt: 3, pb: 1.5, cursor: 'move', textAlign: 'right', minHeight: 110 }}>
          <Typography fontSize="0.75rem" color="#999" minHeight={20} noWrap textAlign="right" sx={{ mb: 0.5 }}>
            {expression || ' '}
          </Typography>
          <Typography color={TEXT_NUM} fontWeight={300} noWrap
            sx={{ fontSize, lineHeight: 1, transition: 'font-size 0.12s ease', letterSpacing: -1 }}>
            {display}
          </Typography>
          <IconButton size="small" 
            sx={{ position: 'absolute', top: 12, right: 12, color: showHistory ? '#667eea' : '#ccc' }} 
            onClick={() => setShowHistory(s => !s)}>
            <HistoryIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Button Grid */}
        <Box sx={{ p: 2, pt: 0.5, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {ROWS.flat().map((btn, i) => {
            const isActive = activeBtn === btn.label;
            return (
              <Box key={i} onClick={() => handleBtn(btn.label)} sx={{
                bgcolor: isActive ? (btn.color === BTN_OP ? '#e08700' : '#c0c0c0') : btn.color,
                borderRadius: '50%',
                width: 60, height: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                fontWeight: btn.color === BTN_NUM ? 400 : 700,
                fontSize: btn.label === 'Rand' ? '0.8rem' : '1.4rem',
                color: btn.textColor,
                transition: 'all 0.1s ease',
                boxShadow: btn.color === BTN_NUM ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                '&:hover': { filter: 'brightness(0.94)', transform: 'translateY(-1px)' },
                '&:active': { transform: 'scale(0.92)', filter: 'brightness(0.88)' },
              }}>
                {btn.label}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
