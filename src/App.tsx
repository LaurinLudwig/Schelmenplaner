import { useEffect } from 'react';
import { startAutosave } from './app/autosave';
import { offerRecovery } from './app/fileActions';
import { startKeyboard } from './app/keyboard';
import { guardClose, startWindowTitle } from './app/window';
import { START_PAGE, useStore } from './state/store';
import { Canvas } from './ui/canvas/Canvas';
import { ControlBar } from './ui/shell/ControlBar';
import { DialogHost } from './ui/shell/DialogHost';
import { PdfPagePicker } from './ui/shell/PdfPagePicker';
import { RenumberDialog } from './ui/shell/RenumberDialog';
import { ExportDialog } from './ui/export/ExportDialog';
import { ExportProgress } from './ui/export/ExportProgress';
import { ShortcutsOverlay } from './ui/shell/ShortcutsOverlay';
import { Toasts } from './ui/shell/Toasts';
import { Sidebar } from './ui/shell/Sidebar';
import { TabBar } from './ui/shell/TabBar';
import { Toolbar } from './ui/shell/Toolbar';
import { TooltipHost } from './ui/shell/TooltipHost';
import { StartPage } from './ui/startpage/StartPage';

let recoveryChecked = false;

export function App() {
  const theme = useStore((s) => s.ui.theme);
  const activePage = useStore((s) => s.project.pages.find((p) => p.id === s.ui.activePage) ?? null);
  const isStart = useStore((s) => s.ui.activePage === START_PAGE);
  const panelsHidden = useStore((s) => s.ui.panelsHidden);
  const sidebarOpen = useStore((s) => s.ui.sidebarOpen);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const stops = [startKeyboard(), startAutosave(), startWindowTitle(), guardClose()];
    if (!recoveryChecked) {
      recoveryChecked = true;
      void offerRecovery(null);
    }
    return () => stops.forEach((stop) => stop());
  }, []);

  return (
    <div className={`app${isStart ? ' start' : ''}`}>
      <TabBar />
      {isStart || !activePage ? (
        <StartPage />
      ) : (
        <>
          {!panelsHidden && <ControlBar />}
          {!panelsHidden && <Toolbar />}
          <Canvas page={activePage} />
          {!panelsHidden && sidebarOpen && <Sidebar />}
        </>
      )}
      <TooltipHost />
      <Toasts />
      <PdfPagePicker />
      <RenumberDialog />
      <ExportDialog />
      <ExportProgress />
      <DialogHost />
      <ShortcutsOverlay />
    </div>
  );
}
