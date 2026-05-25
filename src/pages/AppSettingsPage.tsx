import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Slider from '@mui/material/Slider';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useNav } from '../App';

export function AppSettingsPage() {
  const { goBack, store, themePref, setThemeMode, ttsRate, setTtsRate } = useNav();

  const handleExport = () => {
    const data = store.exportState();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fiszki-backup.json';
    a.click(); URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') store.importState(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={goBack}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Ustawienia ogólne</Typography>
      </Box>

      <Stack spacing={3}>
        {/* Theme — uses themePref (light/dark/system) not resolved themeMode */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Motyw</Typography>
          <ToggleButtonGroup
            value={themePref}
            exclusive
            onChange={(_, val) => { if (val) setThemeMode(val); }}
            fullWidth
          >
            <ToggleButton value="light"><LightModeIcon sx={{ mr: 1 }} />Jasny</ToggleButton>
            <ToggleButton value="system"><SettingsBrightnessIcon sx={{ mr: 1 }} />System</ToggleButton>
            <ToggleButton value="dark"><DarkModeIcon sx={{ mr: 1 }} />Ciemny</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* TTS speed */}
        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>Prędkość czytania TTS</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Aktualna: {ttsRate.toFixed(1)}x
          </Typography>
          <Slider value={ttsRate} onChange={(_, v) => setTtsRate(v as number)}
            min={0.5} max={2.0} step={0.1} valueLabelDisplay="auto"
            marks={[{ value: 0.5, label: '0.5x' }, { value: 1, label: '1x' }, { value: 2, label: '2x' }]} />
        </Box>

        <Divider />

        {/* Export / Import */}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Kopie zapasowe</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" fullWidth onClick={handleExport}>Eksportuj do JSON</Button>
            <Button variant="outlined" fullWidth component="label">
              Importuj z JSON
              <input type="file" hidden accept=".json" onChange={handleImport} />
            </Button>
          </Box>
        </Box>

        <Divider />

        {/* Reset */}
        <Box>
          <Typography variant="h6" color="error" sx={{ mb: 1 }}>Strefa zagrożenia</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Resetuj bazę danych do stanu początkowego (dane startowe).
          </Typography>
          <Button variant="contained" color="error" fullWidth onClick={() => {
            if (window.confirm('Czy na pewno chcesz zresetować wszystkie dane?')) store.resetToDefault();
          }}>
            Resetuj bazę danych
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
