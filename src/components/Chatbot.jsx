import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useSettings } from '../context/SettingsContext';

export const Chatbot = () => {
  const { settings } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hi! I am the Hule የመኪና ኪራይ Assistant. Choose a question below to get started:' }
  ]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      const { data, error } = await supabase
        .from('chatbot_faqs')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (!error && data) {
        setFaqs(data);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleQuestionClick = (faq) => {
    let answerText = faq.answer;
    if (faq.question.toLowerCase().includes('talk to human')) {
      answerText = `Our master broker is offline. Reach us on Telegram at ${settings.telegramHandle} or call ${settings.brokerPhone}.`;
    }
    
    setMessages((prev) => [
      ...prev,
      { type: 'user', text: faq.question },
      { type: 'bot', text: answerText }
    ]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end">
      {isOpen && (
        <div className="w-80 sm:w-96 bg-white shadow-2xl rounded-2xl mb-4 overflow-hidden fade-in border border-slate-100 flex flex-col" style={{ maxHeight: '600px', height: '80vh' }}>
          {/* Header */}
          <div className="bg-[#8B0000] p-4 text-white flex items-center justify-between shrink-0 shadow-md">
            <div className="flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
              <h3 className="font-bold text-sm tracking-wide">Hule የመኪና ኪራይ Assistant</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-1.5 rounded-full"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] p-3.5 text-[13px] leading-relaxed shadow-sm
                  ${msg.type === 'user' 
                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-white text-slate-800 rounded-2xl rounded-tl-sm border border-slate-200'}
                `}>
                  {msg.text}
                </div>
              </div>
            ))}

            {/* FAQ Buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              {faqs.map((faq) => (
                <button
                  key={faq.id}
                  onClick={() => handleQuestionClick(faq)}
                  className="text-left text-xs bg-white border border-[#8B0000]/30 text-[#8B0000] font-medium rounded-full px-4 py-2 hover:bg-[#8B0000] hover:text-white transition-all shadow-sm"
                >
                  {faq.question}
                </button>
              ))}
            </div>
            
            <div ref={messagesEndRef} className="h-1" />
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-[#8B0000] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(139,0,0,0.3)] hover:bg-[#660000] hover:scale-105 transition-all duration-300"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};
