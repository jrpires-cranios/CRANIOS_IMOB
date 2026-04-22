import OnboardingWizard from '../pages/Onboarding';

export default function OnboardingLayout() {
  return (
    <div className="min-h-screen bg-white">
      {/* Onboarding Wizard tem sua própria tela cheia e lógica interna */}
      <OnboardingWizard />
      <button
        onClick={() => { window.location.href = '/'; }}
        className="fixed top-4 right-8 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-bold shadow-sm transition-colors z-[9999]"
      >
        Voltar
      </button>
    </div>
  );
}
