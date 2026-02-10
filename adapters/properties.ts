import config from '../config';
import type { Property } from '../types/property';

export async function fetchProperties(): Promise<Property[]> {
  if (!config.apiUrl) {
    console.warn('API URL not configured, returning empty array');
    return [];
  }

  try {
    const response = await fetch(config.apiUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Normalize the response data to match our Property interface
    return normalizeProperties(data);
  } catch (error) {
    console.error('Error fetching properties:', error);
    return [];
  }
}

function normalizeProperties(data: any): Property[] {
  // Handle different response formats
  const properties = Array.isArray(data) ? data : data.properties || data.imoveis || [];
  
  return properties.map((item: any) => ({
    id: item.id || item._id || String(Math.random()),
    title: item.title || item.titulo || item.name || 'Imóvel sem título',
    description: item.description || item.descricao || '',
    price: parseFloat(item.price || item.preco || item.valor || '0'),
    location: item.location || item.localizacao || item.endereco || 'Localização não informada',
    bedrooms: parseInt(item.bedrooms || item.quartos || item.dormitorios || '0'),
    bathrooms: parseInt(item.bathrooms || item.banheiros || '0'),
    area: parseFloat(item.area || item.areaTotal || item.metragem || '0'),
    imageUrl: item.imageUrl || item.image || item.foto || item.imagem || '/placeholder-property.jpg',
    images: item.images || item.fotos || item.imagens || [],
    type: normalizeType(item.type || item.tipo || item.finalidade),
    category: item.category || item.categoria || item.tipoImovel,
    features: item.features || item.caracteristicas || [],
    latitude: item.latitude || item.lat,
    longitude: item.longitude || item.lng || item.lon,
    createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
  }));
}

function normalizeType(type: any): 'sale' | 'rent' | 'investment' {
  const typeStr = String(type || '').toLowerCase();
  
  if (typeStr.includes('vend') || typeStr.includes('sale')) {
    return 'sale';
  }
  if (typeStr.includes('alug') || typeStr.includes('rent')) {
    return 'rent';
  }
  if (typeStr.includes('invest')) {
    return 'investment';
  }
  
  return 'sale'; // default
}
