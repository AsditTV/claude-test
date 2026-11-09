import { useCallback, useMemo, useState } from 'react';
import { Background } from './components/layout';
import { RulesContent } from './components/RulesContent';
import { Modal } from './components/ui';
import { GameProvider, useGame } from './hooks/useGame';
import { NavContext, type Screen } from './hooks/useNav';
import { CustomWordsPage } from './pages/CustomWordsPage';
import { DistributionPage } from './pages/DistributionPage';
import { GamePage } from './pages/GamePage';
import { HistoryPage } from './pages/HistoryPage';
import { HomePage } from './pages/HomePage';
import { MrWhiteGuessPage } from './pages/MrWhiteGuessPage';
import { ResultsPage } from './pages/ResultsPage';
import { RevealPage } from './pages/RevealPage';
import { RulesPage } from './pages/RulesPage';
import { SetupPage } from './pages/SetupPage';
import { StatsPage } from './pages/StatsPage';
import { VotePage } from './pages/VotePage';

function Router() {
  const { game } = useGame();
  // Navigation par état : aucune information de jeu n'apparaît dans l'URL.
  const [screen, setScreen] = useState<Screen>(() => (game ? 'game' : 'home'));
  const [rulesOpen, setRulesOpen] = useState(false);

  const go = useCallback((s: Screen) => {
    setScreen(s);
    window.scrollTo({ top: 0 });
  }, []);
  const nav = useMemo(() => ({ screen, go, openRules: () => setRulesOpen(true) }), [screen, go]);

  let page: React.ReactNode;
  let key: string = screen;
  if (screen === 'game' && game) {
    key = `game-${game.id}-${game.phase}-${game.round}`;
    switch (game.phase) {
      case 'distribution':
        page = <DistributionPage />;
        break;
      case 'rules':
        page = <RulesPage />;
        break;
      case 'discussion':
        page = <GamePage />;
        break;
      case 'vote':
        page = <VotePage />;
        break;
      case 'reveal':
        page = <RevealPage />;
        break;
      case 'mrwhite-guess':
        page = <MrWhiteGuessPage />;
        break;
      case 'results':
        page = <ResultsPage />;
        break;
    }
  } else if (screen === 'setup') page = <SetupPage />;
  else if (screen === 'history') page = <HistoryPage />;
  else if (screen === 'stats') page = <StatsPage />;
  else if (screen === 'custom') page = <CustomWordsPage />;
  else {
    key = 'home';
    page = <HomePage />;
  }

  return (
    <NavContext.Provider value={nav}>
      {/* Pas d'animation de sortie au niveau du routeur : une page qui sort ne doit
          jamais se re-rendre avec l'état de la partie suivante. */}
      <div key={key}>{page}</div>
      <Modal open={rulesOpen} onClose={() => setRulesOpen(false)} title="Règles du jeu">
        <RulesContent />
      </Modal>
    </NavContext.Provider>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Background />
      <Router />
    </GameProvider>
  );
}
