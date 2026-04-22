
import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface ChatWidgetProps {
    onSearchFromChat?: (query: string) => void;
}

export default function ChatWidget({ onSearchFromChat }: ChatWidgetProps = {}) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'assistant',
            content: 'Olá! Seja bem-vindo à Crânios IMOB. Eu sou a Elena. Com quem tenho o prazer de falar?',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Session ID persistence
    const [sessionId] = useState(() => {
        const stored = localStorage.getItem('chat_session_id');
        if (stored) return stored;
        const newId = uuidv4();
        localStorage.setItem('chat_session_id', newId);
        return newId;
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        try {
            // Updated to point to new AI Search Chat controller
            const response = await fetch('/api/ai-search/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
                    sessionId: sessionId
                })
            });

            const data = await response.json();
            let reply = data.reply || 'Desculpe, não entendi. Pode repetir?';

            // Check for [BUSCAR: ...] intent
            const searchMatch = reply.match(/\[BUSCAR:(.+?)\]/);
            if (searchMatch) {
                const searchQuery = searchMatch[1].trim();
                reply = reply.replace(searchMatch[0], '').trim();

                if (reply) {
                    setMessages(prev => [...prev, {
                        id: (Date.now() + 1).toString(),
                        role: 'assistant',
                        content: reply,
                        timestamp: new Date()
                    }]);
                }

                setTimeout(() => {
                    if (onSearchFromChat) {
                        onSearchFromChat(searchQuery);
                        setIsOpen(false);
                    }
                }, 1500);

            } else {
                setMessages(prev => [...prev, {
                    id: (Date.now() + 1).toString(),
                    role: 'assistant',
                    content: reply,
                    timestamp: new Date()
                }]);
            }
        } catch (error) {
            console.error('Chat Error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Desculpe, estou com dificuldades de conexão no momento. Tente novamente mais tarde.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col h-[500px] transition-all transform origin-bottom-right">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <span className="text-lg">🤖</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Elena</h3>
                                <p className="text-xs text-blue-100 flex items-center gap-1">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    Consultora Imobiliária
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                    <span className={`text-[10px] block mt-1 ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                                        }`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border border-gray-100 shadow-sm flex items-center gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100">
                        <div className="relative flex items-center gap-2">
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Digite sua dúvida..."
                                className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-500 border-0 rounded-full py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            />
                            <button
                                type="submit"
                                disabled={!inputText.trim() || isTyping}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 flex items-center justify-center group"
                >
                    <span className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                        Falar com Elena
                    </span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </button>
            )}
        </div>
    );
}
