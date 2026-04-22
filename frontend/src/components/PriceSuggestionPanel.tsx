
const T = {
  bg: '#060A14', surface: '#0C1220', card: '#111827',
  border: 'rgba(255,255,255,0.07)',
  accent: '#3B82F6', gold: '#F59E0B', green: '#10B981', danger: '#EF4444',
  textPrimary: '#F9FAFB', textSecondary: '#9CA3AF', textMuted: '#4B5563',
};

interface PricingProps {
  contexto: 'venda' | 'locacao';
  suggestionData: any;
  onApply: (price: number) => void;
}

export default function PriceSuggestionPanel({ contexto, suggestionData, onApply }: PricingProps) {
  if (!suggestionData) return null;

  const { suggestion, rangeMin, rangeMax, confidence, comparablesCount, usedCityFallback } = suggestionData;
  if (!suggestion && comparablesCount === 0) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  };

  let confColor = T.green;
  if (confidence === 'MEDIA') confColor = T.gold;
  if (confidence === 'BAIXA') confColor = T.danger;

  return (
    <div style={{
      background: T.surface, 
      border: `1px solid ${confColor}44`,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, height: 2, background: confColor, width: '100%' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: T.textSecondary, textTransform: 'uppercase' }}>
          🤖 Sugestão de Preço IA ({contexto})
        </div>
        <div style={{ fontSize: 10, background: confColor + '22', color: confColor, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
          Confiança: {confidence}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.textPrimary, marginBottom: 4 }}>
            {formatCurrency(suggestion)}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            Faixa: {formatCurrency(rangeMin)} — {formatCurrency(rangeMax)}
          </div>
        </div>

        <button 
          onClick={(e) => { e.preventDefault(); onApply(Math.round(suggestion)); }}
          style={{
            background: confColor + '22',
            border: `1px solid ${confColor}44`,
            color: confColor,
            padding: '8px 16px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = confColor + '44'}
          onMouseLeave={(e) => e.currentTarget.style.background = confColor + '22'}
        >
          Usar este preço
        </button>
      </div>

      <div style={{ fontSize: 11, color: T.textSecondary, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📊 Baseado em {comparablesCount} imóveis similares{usedCityFallback ? ' na cidade' : ' no bairro'}.</span>
      </div>
    </div>
  );
}
