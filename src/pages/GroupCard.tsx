import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import StyleIcon from '@mui/icons-material/Style';
import type { FlashcardGroup, StudyMode } from '../types/models';
import { getDueCount, getMastery } from '../data/seedData';

interface GroupCardProps {
  group: FlashcardGroup;
  modes: StudyMode[];
  onBrowse: () => void;
  onStudy: (modeId?: string) => void;
  onSettings: () => void;
}

export function GroupCard({ group, modes, onBrowse, onStudy, onSettings }: GroupCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const dueCount = getDueCount(group);
  const mastery = getMastery(group);

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StyleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              {group.name}
            </Typography>
          </Box>
          <IconButton size="small" onClick={onSettings} id={`settings-${group.id}`} aria-label="Ustawienia grupy">
            <Box component="span" sx={{ fontSize: 18 }}>⚙️</Box>
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {group.cards.length} {group.cards.length === 1 ? 'fiszka' : group.cards.length < 5 ? 'fiszki' : 'fiszek'}
        </Typography>

        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption" color="text.secondary">
            Opanowanie
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {mastery}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={mastery}
          sx={{ height: 8, borderRadius: 4, mb: 2 }}
        />

        {dueCount > 0 && (
          <Typography variant="body2" color="error" sx={{ fontWeight: 500 }}>
            {dueCount} do powtórki
          </Typography>
        )}
        {dueCount === 0 && (
          <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
            ✓ Wszystko powtórzone
          </Typography>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button size="small" onClick={onBrowse} id={`browse-${group.id}`}>
          Przeglądaj
        </Button>
        <ButtonGroup variant="contained" size="small">
          <Button onClick={() => onStudy()} id={`study-${group.id}`}>
            Ucz się
          </Button>
          <Button
            size="small"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            id={`mode-select-${group.id}`}
            aria-label="Wybierz tryb"
            sx={{ px: 0.5, minWidth: 32 }}
          >
            <ArrowDropDownIcon />
          </Button>
        </ButtonGroup>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {modes.map(m => (
            <MenuItem
              key={m.id}
              onClick={() => { setAnchorEl(null); onStudy(m.id); }}
              selected={m.id === group.activeModeId}
            >
              {m.name}
            </MenuItem>
          ))}
        </Menu>
      </CardActions>
    </Card>
  );
}
