import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SchoolIcon from '@mui/icons-material/School';
import ReplayIcon from '@mui/icons-material/Replay';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { useNav } from '../App';
import { SegmentedProgressBar, computeCardStats } from '../components/SegmentedProgressBar';

function computeStreak(heatmap: Record<string, number>): number {
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (heatmap[key]) streak++; else break;
  }
  return streak;
}

function HeatmapSvg({ heatmap }: { heatmap: Record<string, number> }) {
  const cols = 20, rows = 7;
  const cellSize = 14, gap = 3;
  const today = new Date();
  const cells: { x: number; y: number; date: string; count: number }[] = [];

  for (let col = cols - 1; col >= 0; col--) {
    for (let row = 0; row < rows; row++) {
      const daysBack = (cols - 1 - col) * 7 + (6 - row);
      const d = new Date(today); d.setDate(d.getDate() - daysBack);
      const key = d.toISOString().slice(0, 10);
      cells.push({ x: col * (cellSize + gap) + 30, y: row * (cellSize + gap), date: key, count: heatmap[key] || 0 });
    }
  }

  const colorFor = (count: number): string => {
    if (count === 0) return '#2d2d3a';
    if (count <= 2) return '#0e4429';
    if (count <= 5) return '#006d32';
    if (count <= 10) return '#26a641';
    return '#39d353';
  };

  const w = cols * (cellSize + gap) + 30, h = rows * (cellSize + gap);
  const dayLabels = ['Pon', '', 'Śr', '', 'Pią', '', 'Nie'];

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: 500 }}>
      {dayLabels.map((label, i) => label && (
        <text key={i} x={0} y={i * (cellSize + gap) + cellSize - 2} fontSize={9} fill="#888">{label}</text>
      ))}
      {cells.map((c, i) => (
        <Tooltip key={i} title={`${c.date}: ${c.count} powtórek`} arrow>
          <rect x={c.x} y={c.y} width={cellSize} height={cellSize} rx={3} fill={colorFor(c.count)} style={{ cursor: 'pointer' }} />
        </Tooltip>
      ))}
    </svg>
  );
}

export function StatsPage() {
  const { goBack, store } = useNav();
  const { groups, activityHeatmap, getDueCards } = store;

  const totalCards = groups.reduce((a, g) => a + g.cards.length, 0);
  const totalDue = groups.reduce((a, g) => a + getDueCards(g.id).length, 0);
  const streak = useMemo(() => computeStreak(activityHeatmap), [activityHeatmap]);
  const activeDays = Object.keys(activityHeatmap).length;

  // Global card stats across all groups
  const allCards = useMemo(() => groups.flatMap(g => g.cards), [groups]);
  const globalStats = useMemo(() => computeCardStats(allCards), [allCards]);

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={goBack}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Statystyki</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { icon: <LocalFireDepartmentIcon />, label: 'Seria dni', value: `${streak} 🔥`, color: 'warning.main' },
          { icon: <SchoolIcon />, label: 'Opanowane', value: `${globalStats.mastered}/${totalCards}`, color: 'success.main' },
          { icon: <ReplayIcon />, label: 'Do powtórki', value: String(totalDue), color: 'error.main' },
          { icon: <CalendarMonthIcon />, label: 'Dni aktywności', value: String(activeDays), color: 'primary.main' },
        ].map((m, i) => (
          <Grid size={{ xs: 6, sm: 3 }} key={i}>
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                <Box sx={{ color: m.color, mb: 1 }}>{m.icon}</Box>
                <Typography variant="caption" color="text.secondary">{m.label}</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: m.color }}>{m.value}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Global progress bar */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Ogólny postęp</Typography>
          <SegmentedProgressBar stats={globalStats} height={18} showLegend />
        </CardContent>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Heatmapa aktywności</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <HeatmapSvg heatmap={activityHeatmap} />
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Postępy zestawów</Typography>
          {groups.map(g => {
            const groupStats = computeCardStats(g.cards);
            return (
              <Box key={g.id} sx={{ mb: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{g.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{g.cards.length} fiszek</Typography>
                </Box>
                <SegmentedProgressBar stats={groupStats} height={10} />
              </Box>
            );
          })}
        </CardContent>
      </Card>
    </Box>
  );
}
