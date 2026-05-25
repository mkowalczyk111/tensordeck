import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Flashcard } from '../types/models';

export interface CardStats {
  total: number;
  newCount: number;
  learning: number;   // state 1 or 3
  review: number;     // state 2, not yet mastered
  mastered: number;   // state 2, repetitions >= 3
}

export function computeCardStats(cards: Flashcard[]): CardStats {
  let newCount = 0, learning = 0, review = 0, mastered = 0;
  for (const c of cards) {
    if (c.srsState.state === 0) newCount++;
    else if (c.srsState.state === 1 || c.srsState.state === 3) learning++;
    else if (c.srsState.state === 2 && c.srsState.repetitions >= 3) mastered++;
    else review++;
  }
  return { total: cards.length, newCount, learning, review, mastered };
}

// Colors
const COLORS = {
  new: '#42a5f5',       // blue
  learning: '#ffa726',  // orange
  review: '#66bb6a',    // green
  mastered: '#ab47bc',  // purple
};

interface Props {
  stats: CardStats;
  height?: number;
  showLegend?: boolean;
}

export function SegmentedProgressBar({ stats, height = 12, showLegend = false }: Props) {
  const { total, newCount, learning, review, mastered } = stats;
  if (total === 0) return (
    <Box sx={{ height, borderRadius: height / 2, bgcolor: 'action.disabledBackground' }} />
  );

  const segments = [
    { count: mastered, color: COLORS.mastered, label: 'Opanowane' },
    { count: review, color: COLORS.review, label: 'Powtórka' },
    { count: learning, color: COLORS.learning, label: 'Uczone' },
    { count: newCount, color: COLORS.new, label: 'Nowe' },
  ].filter(s => s.count > 0);

  return (
    <Box>
      <Box sx={{
        display: 'flex', borderRadius: height / 2, overflow: 'hidden',
        height, bgcolor: 'action.disabledBackground',
      }}>
        {segments.map((seg, i) => (
          <Tooltip key={i} title={`${seg.label}: ${seg.count} (${Math.round(seg.count / total * 100)}%)`}>
            <Box sx={{
              width: `${(seg.count / total) * 100}%`, bgcolor: seg.color,
              transition: 'width 0.5s ease',
            }} />
          </Tooltip>
        ))}
      </Box>
      {showLegend && (
        <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { color: COLORS.mastered, label: 'Opanowane', count: mastered },
            { color: COLORS.review, label: 'Powtórka', count: review },
            { color: COLORS.learning, label: 'Uczone', count: learning },
            { color: COLORS.new, label: 'Nowe', count: newCount },
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
              <Typography variant="caption" color="text.secondary">
                {item.label} ({item.count})
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
