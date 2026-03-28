import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { conversationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ChatWindow from '../components/messaging/ChatWindow';

const MessagesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const response = await conversationsAPI.getAll();
      setConversations(response.data || []);

      // If a specific conversation is in URL, select it
      if (conversationId) {
        const conv = response.data?.find(c => c.conversation_id === parseInt(conversationId));
        if (conv) {
          setSelectedConversation(conv);
        }
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [conversationId]);

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation.conversation_id}`);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    navigate('/messages');
  };

  const formatMessageTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 168) { // Less than a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 card overflow-y-auto`}>
          <div className="mb-4 pb-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
            <p className="text-sm text-gray-600 mt-1">
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          {conversations.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-gray-600 mb-2">No messages yet</p>
              <p className="text-sm text-gray-500">
                Start a conversation by contacting volunteers or requesters!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.conversation_id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.conversation_id === conversation.conversation_id
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {conversation.other_user?.name}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {conversation.other_user?.user_type}
                      </p>
                    </div>
                    {conversation.last_message_at && (
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatMessageTime(conversation.last_message_at)}
                      </span>
                    )}
                  </div>
                  {conversation.last_message && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message.sender_id === user?.user_id && 'You: '}
                      {conversation.last_message.message_text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat Window */}
        <div className={`${selectedConversation ? 'block' : 'hidden md:block'} flex-1 card`}>
          {selectedConversation ? (
            <ChatWindow
              conversation={selectedConversation}
              onBack={handleBackToList}
              onMessageSent={fetchConversations}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <svg
                  className="w-24 h-24 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <p className="text-gray-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
