// Model associations
import User from './User.js';
import Offer from './Offer.js';
import OfferItem from './OfferItem.js';
import Request from './Request.js';
import RequestItem from './RequestItem.js';
import Conversation from './Conversation.js';
import Message from './Message.js';

// User - Offer associations
User.hasMany(Offer, { foreignKey: 'user_id', as: 'offers' });
Offer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Offer - OfferItem associations
Offer.hasMany(OfferItem, { foreignKey: 'offer_id', as: 'items' });
OfferItem.belongsTo(Offer, { foreignKey: 'offer_id', as: 'offer' });

// User - Request associations
User.hasMany(Request, { foreignKey: 'user_id', as: 'requests' });
Request.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Request - RequestItem associations
Request.hasMany(RequestItem, { foreignKey: 'request_id', as: 'items' });
RequestItem.belongsTo(Request, { foreignKey: 'request_id', as: 'request' });

// Conversation - User associations
Conversation.belongsTo(User, { foreignKey: 'participant_1_id', as: 'user1' });
Conversation.belongsTo(User, { foreignKey: 'participant_2_id', as: 'user2' });

// Conversation - Message associations
Conversation.hasMany(Message, { foreignKey: 'conversation_id', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversation_id', as: 'conversation' });

// Message - User associations
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

export { User, Offer, OfferItem, Request, RequestItem, Conversation, Message };
