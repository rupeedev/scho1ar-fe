import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Minimize2, MessageCircle, User, Bot, Paperclip, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useClerkAuth } from '@/hooks/use-clerk-auth';
import { toast } from '@/components/ui/use-toast';

interface Attachment {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
  attachment?: Attachment;
}

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const SupportChat = ({ isOpen, onClose, onOpen }: SupportChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useClerkAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Add welcome message when chat opens for the first time
      const welcomeMessage: Message = {
        id: '1',
        text: `Hello ${user?.email?.split('@')[0] || 'there'}! 👋 How can we help you today?`,
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, user, messages.length]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');

    // Simulate support response after a brief delay
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for your message! Our support team will get back to you shortly. In the meantime, you can check our documentation or continue using Scho1ar Solution.",
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, supportMessage]);
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please select an image, PDF, or document file",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    // Create a URL for the file (in real app, you'd upload to a server)
    const fileUrl = URL.createObjectURL(file);
    
    const attachment: Attachment = {
      name: file.name,
      size: file.size,
      type: file.type,
      url: fileUrl
    };

    const messageWithAttachment: Message = {
      id: Date.now().toString(),
      text: newMessage || `Sent ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
      attachment
    };

    setMessages(prev => [...prev, messageWithAttachment]);
    setNewMessage('');
    setIsUploading(false);

    // Simulate support response
    setTimeout(() => {
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Thank you for sharing the file! I've received it and will review it shortly. Is there anything specific about this file you'd like me to look at?",
        sender: 'support',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, supportMessage]);
    }, 1500);

    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} />;
    return <FileText size={16} />;
  };

  return (
    <>
      {/* Floating Chat Icon - only show when chat is closed */}
      {!isOpen && (
        <div 
          className="fixed right-6 bottom-6 z-[9999]"
          style={{ pointerEvents: 'auto' }}
        >
          <Button
            id="costpie-support-chat-button"
            data-testid="support-chat-button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Support chat button clicked');
              onOpen();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border-0 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            title="Open Support Chat"
            type="button"
            style={{ pointerEvents: 'auto', isolation: 'isolate' }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 via-blue-500 to-yellow-400 flex items-center justify-center relative overflow-hidden">
              {/* Simplified nature scene */}
              <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-emerald-400 opacity-80"></div>
              
              {/* Palm tree */}
              <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                {/* Trunk */}
                <div className="w-1 h-4 bg-amber-800 rounded-b-sm"></div>
                {/* Leaves */}
                <div className="absolute -top-1.5 left-0 transform -translate-x-1/2">
                  <div className="w-3 h-0.5 bg-green-700 rounded-full transform -rotate-45 origin-right"></div>
                  <div className="w-3 h-0.5 bg-green-700 rounded-full transform rotate-45 origin-right"></div>
                  <div className="w-3 h-0.5 bg-green-700 rounded-full transform -rotate-12 origin-right"></div>
                  <div className="w-3 h-0.5 bg-green-700 rounded-full transform rotate-12 origin-right"></div>
                </div>
              </div>
              
              {/* Sun */}
              <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full shadow-sm"></div>
              
              {/* Island base */}
              <div className="absolute bottom-0 w-full h-2 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-b-full"></div>
            </div>
          </Button>
        </div>
      )}

      {/* Chat Window - only show when chat is open */}
      {isOpen && (
        <div className={`fixed right-4 bottom-4 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[9998] transition-all duration-300 ${
          isMinimized ? 'h-14' : 'h-[600px]'
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} />
              <span className="font-semibold">Support Chat</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={onClose}
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 p-4 h-[480px]">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-2 max-w-[80%] ${
                        message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}>
                        {/* Avatar */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === 'user' 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        }`}>
                          {message.sender === 'user' ? (
                            <User size={16} />
                          ) : (
                            <Bot size={16} />
                          )}
                        </div>
                        
                        {/* Message */}
                        <div className={`rounded-lg px-3 py-2 ${
                          message.sender === 'user'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}>
                          <p className="text-sm">{message.text}</p>
                          
                          {/* Attachment */}
                          {message.attachment && (
                            <div className={`mt-2 p-2 rounded border ${
                              message.sender === 'user' 
                                ? 'border-emerald-300 bg-emerald-400' 
                                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600'
                            }`}>
                              <div className="flex items-center gap-2">
                                {getFileIcon(message.attachment.type)}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${
                                    message.sender === 'user' ? 'text-white' : 'text-gray-900 dark:text-gray-100'
                                  }`}>
                                    {message.attachment.name}
                                  </p>
                                  <p className={`text-xs ${
                                    message.sender === 'user' 
                                      ? 'text-emerald-100' 
                                      : 'text-gray-500 dark:text-gray-400'
                                  }`}>
                                    {formatFileSize(message.attachment.size)}
                                  </p>
                                </div>
                                {message.attachment.type.startsWith('image/') && (
                                  <img
                                    src={message.attachment.url}
                                    alt={message.attachment.name}
                                    className="w-12 h-12 object-cover rounded"
                                    onClick={() => window.open(message.attachment!.url, '_blank')}
                                    style={{ cursor: 'pointer' }}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                          
                          <p className={`text-xs mt-1 ${
                            message.sender === 'user' 
                              ? 'text-emerald-100' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleAttachmentClick}
                    disabled={isUploading}
                    className="shrink-0 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    title="Attach file (max 5MB)"
                  >
                    <Paperclip size={16} className={isUploading ? 'animate-spin' : ''} />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="flex-1 text-sm border-gray-300 dark:border-gray-600 focus:ring-emerald-500 focus:border-emerald-500"
                    disabled={isUploading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isUploading}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 shrink-0"
                  >
                    <Send size={16} />
                  </Button>
                </div>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SupportChat;