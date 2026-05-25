import { useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Fab from '@mui/material/Fab';

import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Popper from '@mui/material/Popper';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import BookIcon from '@mui/icons-material/Book';
import AddIcon from '@mui/icons-material/Add';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TuneIcon from '@mui/icons-material/Tune';
import PersonIcon from '@mui/icons-material/Person';
import { useNav } from '../App';
import { SegmentedProgressBar, computeCardStats } from '../components/SegmentedProgressBar';
import type { FlashcardGroup } from '../types/models';

function GroupStudyButton({ group, onStudy, onModeChange }: {
  group: FlashcardGroup;
  onStudy: () => void;
  onModeChange: (modeId: string) => void;
}) {
  const { store } = useNav();
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const dueCount = store.getDueCards(group.id).length;
  const activeMode = store.studyModes.find(m => m.id === group.activeModeId);
  const modeName = activeMode?.name || 'Klasyczny';

  return (
    <>
      <ButtonGroup variant="contained" ref={anchorRef} size="small" disableElevation
        sx={{ minWidth: 0, width: '100%', '& .MuiButtonGroup-grouped': { borderColor: 'primary.dark' } }}>
        <Button onClick={onStudy} disabled={dueCount === 0}
          startIcon={<PlayArrowIcon />}
          sx={{ flexGrow: 1, textTransform: 'none', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', justifyContent: 'flex-start' }}>
          {modeName}
        </Button>
        <Button size="small" onClick={() => setOpen(prev => !prev)}
          sx={{ px: 0, minWidth: 28, maxWidth: 28 }}>
          <ArrowDropDownIcon fontSize="small" />
        </Button>
      </ButtonGroup>
      <Popper open={open} anchorEl={anchorRef.current} transition placement="bottom-end"
        sx={{ zIndex: 1300 }}>
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper elevation={8}>
              <ClickAwayListener onClickAway={() => setOpen(false)}>
                <MenuList dense>
                  {store.studyModes.map(m => (
                    <MenuItem key={m.id} selected={m.id === group.activeModeId}
                      onClick={() => { onModeChange(m.id); setOpen(false); }}>
                      {m.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

export function DashboardPage() {
  const { navigate, store } = useNav();
  const { groups, getDueCards, user, signIn, signOut } = store;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuAnchorRef = useRef<HTMLButtonElement>(null);

  const handleLogin = async () => {
    try { await signIn(); } catch (e) { console.error('Login failed', e); }
  };

  return (
    <Box sx={{ p: 3, pb: 12, maxWidth: 960, mx: 'auto' }}>
      {/* Top bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BookIcon color="primary" sx={{ fontSize: 36 }} />
          <Typography variant="h4" sx={{ fontWeight: 700 }}>TensorDeck</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => navigate('stats')}><BarChartIcon /></IconButton>
          <IconButton onClick={() => navigate('app-settings')}><SettingsIcon /></IconButton>
          {user ? (
            <>
              <IconButton
                ref={userMenuAnchorRef}
                onClick={() => setUserMenuOpen(prev => !prev)}
              >
                <Avatar src={user.photoURL || ''} sx={{ width: 32, height: 32 }}>{user.displayName?.[0]}</Avatar>
              </IconButton>
              <Popper open={userMenuOpen} anchorEl={userMenuAnchorRef.current} transition placement="bottom-end" sx={{ zIndex: 1300 }}>
                {({ TransitionProps }) => (
                  <Grow {...TransitionProps}>
                    <Paper elevation={8} sx={{ p: 2, minWidth: 220 }}>
                      <ClickAwayListener onClickAway={() => setUserMenuOpen(false)}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                          <Avatar src={user.photoURL || ''} sx={{ width: 48, height: 48, mb: 1 }}>{user.displayName?.[0]}</Avatar>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, textAlign: 'center' }}>
                            {user.displayName || 'Użytkownik'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center', wordBreak: 'break-all' }}>
                            {user.email}
                          </Typography>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            fullWidth
                            onClick={() => {
                              signOut();
                              setUserMenuOpen(false);
                            }}
                          >
                            Wyloguj się
                          </Button>
                        </Box>
                      </ClickAwayListener>
                    </Paper>
                  </Grow>
                )}
              </Popper>
            </>
          ) : (
            <IconButton onClick={handleLogin}><PersonIcon /></IconButton>
          )}
        </Box>
      </Box>

      {/* Groups grid */}
      <Grid container spacing={3}>
        {groups.map(group => {
          const dueCount = getDueCards(group.id).length;
          const cardStats = computeCardStats(group.cards);
          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>{group.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {group.cards.length} fiszek
                  </Typography>
                  <SegmentedProgressBar stats={cardStats} height={10} />
                  {dueCount > 0 && (
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>
                      {dueCount} do powtórki
                    </Typography>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2, gap: 0.5 }}>
                  <IconButton size="small" onClick={() => navigate('browse', { groupId: group.id })}
                    color="primary"><VisibilityIcon /></IconButton>
                  <IconButton size="small" onClick={() => navigate('settings', { groupId: group.id })}
                    color="primary"><TuneIcon /></IconButton>
                  <Box sx={{ flexGrow: 1 }}>
                    <GroupStudyButton group={group}
                      onStudy={() => navigate('study', { groupId: group.id })}
                      onModeChange={(modeId) => store.updateGroup({ ...group, activeModeId: modeId })} />
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Single FAB — plus icon, navigates to import */}
      <Fab color="primary" onClick={() => navigate('import')} aria-label="add"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}>
        <AddIcon />
      </Fab>
    </Box>
  );
}
