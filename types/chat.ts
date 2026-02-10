export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  properties?: Array<{
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    location: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
  }>;
  timestamp: Date;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
}

export interface ChatResponse {
  message: string;
  properties?: Array<{
    id: string;
    title: string;
    price: number;
    imageUrl: string;
    location: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
  }>;
}
