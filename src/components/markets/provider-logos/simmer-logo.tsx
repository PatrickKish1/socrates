export function SimmerLogo({ className }: { className?: string }) {
  return (
    <div 
      className={`flex items-center gap-1 font-mono font-bold ${className || ''}`} 
      style={{ color: '#60a5fa' }}
    >
      <span>&gt;_</span>
      <span>SIMMER</span>
    </div>
  );
}

