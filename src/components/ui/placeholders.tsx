// Placeholders SVG pour différents types de propriétés
export const PLACEHOLDERS = {
  MAISON: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <g transform="translate(200, 150)">
        <!-- Maison -->
        <path d="M-60,-20 L-60,40 L-20,40 L-20,20 L20,20 L20,40 L60,40 L60,-20 L0,-60 Z" 
              fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
        <!-- Toit -->
        <path d="M-80,-20 L0,-80 L80,-20" 
              fill="#dc2626" stroke="#991b1b" stroke-width="2"/>
        <!-- Porte -->
        <rect x="-10" y="10" width="20" height="30" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/>
        <!-- Fenêtres -->
        <rect x="-40" y="-10" width="15" height="15" fill="#60a5fa" stroke="#3b82f6" stroke-width="1"/>
        <rect x="25" y="-10" width="15" height="15" fill="#60a5fa" stroke="#3b82f6" stroke-width="1"/>
      </g>
      <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="16" fill="#6b7280">Image non disponible</text>
      <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="12" fill="#9ca3af">Maison</text>
    </svg>
  `)}`,
  
  TERRAIN: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <g transform="translate(200, 150)">
        <!-- Terrain -->
        <rect x="-80" y="-20" width="160" height="80" fill="#86efac" stroke="#22c55e" stroke-width="2"/>
        <!-- Lignes de délimitation -->
        <line x1="-80" y1="-20" x2="80" y2="-20" stroke="#16a34a" stroke-width="1" stroke-dasharray="5,5"/>
        <line x1="-80" y1="60" x2="80" y2="60" stroke="#16a34a" stroke-width="1" stroke-dasharray="5,5"/>
        <line x1="-80" y1="-20" x2="-80" y2="60" stroke="#16a34a" stroke-width="1" stroke-dasharray="5,5"/>
        <line x1="80" y1="-20" x2="80" y2="60" stroke="#16a34a" stroke-width="1" stroke-dasharray="5,5"/>
        <!-- Panneau -->
        <rect x="-30" y="-40" width="60" height="15" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
        <text x="0" y="-30" text-anchor="middle" font-family="Arial, sans-serif" 
              font-size="10" fill="#78350f">À VENDRE</text>
      </g>
      <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="16" fill="#6b7280">Image non disponible</text>
      <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="12" fill="#9ca3af">Terrain</text>
    </svg>
  `)}`,
  
  BUREAU: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <g transform="translate(200, 150)">
        <!-- Bâtiment -->
        <rect x="-60" y="-40" width="120" height="80" fill="#d1d5db" stroke="#6b7280" stroke-width="2"/>
        <!-- Fenêtres -->
        <g fill="#60a5fa" stroke="#3b82f6" stroke-width="1">
          <rect x="-50" y="-30" width="15" height="15"/>
          <rect x="-25" y="-30" width="15" height="15"/>
          <rect x="10" y="-30" width="15" height="15"/>
          <rect x="35" y="-30" width="15" height="15"/>
          <rect x="-50" y="0" width="15" height="15"/>
          <rect x="-25" y="0" width="15" height="15"/>
          <rect x="10" y="0" width="15" height="15"/>
          <rect x="35" y="0" width="15" height="15"/>
        </g>
        <!-- Porte -->
        <rect x="-10" y="30" width="20" height="10" fill="#9ca3af" stroke="#6b7280" stroke-width="1"/>
      </g>
      <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="16" fill="#6b7280">Image non disponible</text>
      <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="12" fill="#9ca3af">Bureau</text>
    </svg>
  `)}`,
  
  HANGAR: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <g transform="translate(200, 150)">
        <!-- Hangar -->
        <path d="M-80,20 L-80,-20 L-60,-40 L60,-40 L80,-20 L80,20 Z" 
              fill="#9ca3af" stroke="#6b7280" stroke-width="2"/>
        <!-- Base -->
        <rect x="-80" y="20" width="160" height="40" fill="#d1d5db" stroke="#6b7280" stroke-width="2"/>
        <!-- Porte -->
        <rect x="-15" y="30" width="30" height="30" fill="#4b5563" stroke="#1f2937" stroke-width="2"/>
        <rect x="-10" y="35" width="20" height="20" fill="#6b7280"/>
      </g>
      <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="16" fill="#6b7280">Image non disponible</text>
      <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="12" fill="#9ca3af">Hangar</text>
    </svg>
  `)}`,
  
  DEFAULT: `data:image/svg+xml;base64,${btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#f3f4f6"/>
      <g transform="translate(200, 150)">
        <!-- Icône générique -->
        <circle cx="0" cy="-20" r="30" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
        <path d="M-15,-20 L0,-35 L15,-20 M0,-35 L0,-5 M-10,5 L0,15 L10,5" 
              stroke="#6b7280" stroke-width="3" fill="none" stroke-linecap="round"/>
        <!-- Base -->
        <rect x="-40" y="40" width="80" height="20" fill="#d1d5db" stroke="#6b7280" stroke-width="2"/>
      </g>
      <text x="200" y="250" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="16" fill="#6b7280">Image non disponible</text>
      <text x="200" y="270" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="12" fill="#9ca3af">Propriété</text>
    </svg>
  `)}`
};

// Fonction pour obtenir le placeholder selon le type de propriété
export const getPlaceholderByType = (type?: string): string => {
  switch (type?.toUpperCase()) {
    case 'MAISON': return PLACEHOLDERS.MAISON;
    case 'TERRAIN': return PLACEHOLDERS.TERRAIN;
    case 'BUREAU': return PLACEHOLDERS.BUREAU;
    case 'HANGAR': return PLACEHOLDERS.HANGAR;
    default: return PLACEHOLDERS.DEFAULT;
  }
};