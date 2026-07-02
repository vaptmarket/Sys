/**
 * Calculates the distance between two coordinates in kilometers using the Haversine formula.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Gets the user's current position using the Geolocation API.
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/**
 * Capital coordinates for fallback sorting
 */
export const CAPITAL_COORDS: Record<string, { lat: number; lng: number }> = {
  'AC': { lat: -9.974, lng: -67.807 },
  'AL': { lat: -9.665, lng: -35.735 },
  'AM': { lat: -3.119, lng: -60.021 },
  'AP': { lat: 0.034, lng: -51.069 },
  'BA': { lat: -12.971, lng: -38.510 },
  'CE': { lat: -3.731, lng: -38.526 },
  'DF': { lat: -15.793, lng: -47.882 },
  'ES': { lat: -20.315, lng: -40.312 },
  'GO': { lat: -16.686, lng: -49.264 },
  'MA': { lat: -2.530, lng: -44.302 },
  'MG': { lat: -19.921, lng: -43.937 },
  'MS': { lat: -20.443, lng: -54.646 },
  'MT': { lat: -15.601, lng: -56.096 },
  'PA': { lat: -1.455, lng: -48.490 },
  'PB': { lat: -7.115, lng: -34.863 },
  'PE': { lat: -8.054, lng: -34.881 },
  'PI': { lat: -5.089, lng: -42.801 },
  'PR': { lat: -25.429, lng: -49.271 },
  'RJ': { lat: -22.906, lng: -43.172 },
  'RN': { lat: -5.795, lng: -35.209 },
  'RO': { lat: -8.761, lng: -63.903 },
  'RR': { lat: 2.819, lng: -60.673 },
  'RS': { lat: -30.034, lng: -51.217 },
  'SC': { lat: -27.595, lng: -48.548 },
  'SE': { lat: -10.911, lng: -37.073 },
  'SP': { lat: -23.550, lng: -46.633 },
  'TO': { lat: -10.167, lng: -48.331 }
};

/**
 * Gets city and state from coordinates using OpenStreetMap Nominatim.
 */
export async function getCityFromCoords(lat: number, lng: number): Promise<{ city: string; state: string } | null> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`, {
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    });
    const data = await res.json();
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.municipality || data.address.suburb || '';
      const state = data.address.state || '';
      // Approximate state initials from full state name if needed, or default
      let stateInitials = 'SP';
      const stateLower = state.toLowerCase();
      if (stateLower.includes('são paulo') || stateLower.includes('sao paulo')) stateInitials = 'SP';
      else if (stateLower.includes('rio de janeiro')) stateInitials = 'RJ';
      else if (stateLower.includes('minas gerais')) stateInitials = 'MG';
      else if (stateLower.includes('espírito santo') || stateLower.includes('espirito santo')) stateInitials = 'ES';
      else if (stateLower.includes('bahia')) stateInitials = 'BA';
      else if (stateLower.includes('ceará') || stateLower.includes('ceara')) stateInitials = 'CE';
      else if (stateLower.includes('paraná') || stateLower.includes('parana')) stateInitials = 'PR';
      else if (stateLower.includes('rio grande do sul')) stateInitials = 'RS';
      else if (stateLower.includes('santa catarina')) stateInitials = 'SC';
      else if (stateLower.includes('goiás') || stateLower.includes('goias')) stateInitials = 'GO';
      else if (stateLower.includes('distrito federal')) stateInitials = 'DF';
      else if (stateLower.includes('pernambuco')) stateInitials = 'PE';
      
      return { 
        city: city || 'Minha Localização', 
        state: stateInitials 
      };
    }
  } catch (err) {
    console.error('Error in reverse geocoding:', err);
  }
  return null;
}

/**
 * Fetch details for a CEP.
 */
export async function fetchAddressByCep(cep: string): Promise<{ city: string; state: string; street?: string; neighborhood?: string } | null> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data && !data.erro) {
      return {
        city: data.localidade,
        state: data.uf,
        street: data.logradouro,
        neighborhood: data.bairro
      };
    }
  } catch (err) {
    console.error('Error in ViaCEP lookup:', err);
  }
  return null;
}

