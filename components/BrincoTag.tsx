interface BrincoTagProps {
  brinco: string;
  size?: 'sm' | 'md' | 'lg';
}

export function BrincoTag({ brinco, size = 'md' }: BrincoTagProps) {
  const dims = size === 'sm' ? { w: 40, h: 42 } : size === 'lg' ? { w: 88, h: 92 } : { w: 60, h: 63 };

  // Font sizes scale per size
  const cfaSize = size === 'sm' ? 5.5 : size === 'lg' ? 10 : 7;
  const numSize = size === 'sm' ? 9 : size === 'lg' ? 17 : 12;
  const subSize = size === 'sm' ? 4.5 : size === 'lg' ? 8 : 5.5;

  return (
    <svg width={dims.w} height={dims.h} viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      {/* Ear tag shape - more square */}
      <path
        d="M6 7 Q6 2 12 2 H24 L27 0 H31 L34 2 H46 Q52 2 52 7 V48 Q52 54 46 54 L32 54 Q29 57 29 57 Q29 57 26 54 L12 54 Q6 54 6 48 Z"
        fill="#F5C518"
        stroke="#C4960F"
        strokeWidth="1.2"
      />
      {/* Subtle inner highlight */}
      <path
        d="M8 8 Q8 4 13 4 H24.5 L27 2 H31 L33.5 4 H45 Q50 4 50 8 V47 Q50 52 45 52 L32 52 Q29 55 29 55 Q29 55 26 52 L13 52 Q8 52 8 47 Z"
        fill="#F9D44B"
        opacity="0.5"
      />
      {/* Rivet */}
      <circle cx="29" cy="9" r="4" fill="#C4960F" />
      <circle cx="29" cy="9" r="2.5" fill="#A67C00" />
      <circle cx="28.2" cy="8.2" r="1" fill="#D4A820" opacity="0.6" />

      {/* CFA text */}
      <text x="29" y="21" textAnchor="middle" fill="#5C3D00" fontWeight="800" fontSize={cfaSize} fontFamily="'DM Sans', Arial, sans-serif" letterSpacing="1">CFA</text>
      
      {/* Brinco number - 3 digits */}
      <text x="29" y="38" textAnchor="middle" fill="#2D1A00" fontWeight="900" fontSize={numSize} fontFamily="'DM Sans', Arial, sans-serif">{brinco.slice(-3).padStart(3, '0')}</text>
    </svg>
  );
}
