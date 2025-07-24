'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  className?: string;
}

// Mock AI responses for demonstration
const mockResponses = [
  'Halo, Partisipro Agent disini! Bagaimana saya bisa membantu Anda?',
  'Thank you for your question! As a blockchain-based PPP funding platform, Partisipro allows retail investors to participate in large-scale Indonesian infrastructure projects through tokenization. Would you like to know more about our investment process?',
  "Great question! Our platform uses ERC-3643 compliance for identity verification, which means you only need to complete KYC once to access all projects. This streamlines the investment process significantly. Is there anything specific about our compliance model you'd like to understand better?",
  'Expected Return merupakan estimasi pengembalian investasi tahunan sebesar 12.5% dari jumlah yang Anda investasikan. Perlu dicatat bahwa angka tersebut merupakan proyeksi dan bisa berubah tergantung kinerja proyek.',
];

const ChatBot = ({ className = '' }: ChatBotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseIndex, setResponseIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate API call delay
    setTimeout(() => {
      let text = mockResponses[responseIndex % mockResponses.length];

      if (inputValue.trim().toLowerCase().includes('expected return')) {
        text = mockResponses[3];
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setResponseIndex(prev => prev + 1);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className={`fixed bottom-16 right-4 z-50 ${className}`}>
      {/* Chat Interface */}
      {isOpen && (
        <div className="mb-4 w-96 h-[500px] glass-modern rounded-2xl shadow-2xl border border-white/30 animate-slide-in-bottom">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-primary-200/30 bg-gradient-to-r from-primary-500 to-primary-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Partisipro Assistant
                </h3>
                <p className="text-white/80 text-xs">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 h-[360px] overflow-y-auto scrollbar-hide">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mx-auto mb-3 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <p className="text-muted-foreground text-sm mb-2">
                  Welcome to Partisipro!
                </p>
                <p className="text-xs text-muted-foreground">
                  Ask me anything about our platform, investments, or how to get
                  started.
                </p>
              </div>
            )}

            {messages.map(message => (
              <div
                key={message.id}
                className={`flex mb-4 ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex max-w-[80%] ${
                    message.isUser ? 'flex-row-reverse' : 'flex-row'
                  } items-start gap-2`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.isUser
                        ? 'bg-gradient-to-br from-secondary-500 to-secondary-600'
                        : 'bg-gradient-to-br from-primary-500 to-primary-600'
                    }`}
                  >
                    {message.isUser ? (
                      <User className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Bot className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      message.isUser
                        ? 'bg-gradient-to-br from-secondary-500 to-secondary-600 text-white'
                        : 'bg-secondary-100 border border-secondary-200 text-secondary-900'
                    }`}
                  >
                    <p
                      className={`text-sm leading-relaxed ${message.isUser ? 'text-white' : 'text-secondary-700'}`}
                    >
                      {message.text}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isUser
                          ? 'text-white/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-secondary-100 border border-secondary-200 rounded-2xl px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                      <span className="text-sm text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-primary-200/30">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                disabled={isLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                className="px-3 py-2 min-w-[40px]"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700
          text-white rounded-full shadow-lg hover:shadow-xl
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 active:scale-95
          ${isOpen ? 'rotate-180' : 'hover:rotate-12'}
        `}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>

      {/* Notification Badge (when closed and has unread messages) */}
      {!isOpen && messages.length > 0 && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          !
        </div>
      )}
    </div>
  );
};

export default ChatBot;
