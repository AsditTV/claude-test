import { ArrowRight } from 'lucide-react';
import { Screen, TopBar } from '../components/layout';
import { RulesContent } from '../components/RulesContent';
import { Button } from '../components/ui';
import { useGame } from '../hooks/useGame';

export function RulesPage() {
  const { startDiscussion } = useGame();
  return (
    <Screen
      footer={
        <Button size="xl" block icon={<ArrowRight size={22} />} onClick={startDiscussion} data-testid="rules-continue">
          C’EST COMPRIS
        </Button>
      }
    >
      <TopBar showQuit title="Règles du jeu" />
      <div className="mb-5 pt-2 text-center">
        <h1 className="font-display text-3xl font-black">Comment jouer ?</h1>
        <p className="mt-1 text-slate-400">Petit rappel avant de commencer.</p>
      </div>
      <RulesContent />
    </Screen>
  );
}
