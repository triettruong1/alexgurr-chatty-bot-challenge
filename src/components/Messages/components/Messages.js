import React, { useCallback, useContext, useEffect, useState } from 'react';
import initialBottyMessage from '../../../common/constants/initialBottyMessage';
import io from 'socket.io-client';
import useSound from 'use-sound';
import config from '../../../config';
import LatestMessagesContext from '../../../contexts/LatestMessages/LatestMessages';
import TypingMessage from './TypingMessage';
import Header from './Header';
import Footer from './Footer';
import Message from './Message';
import '../styles/_messages.scss';

const ME = 'me'
const BOT = 'bot'
const messageInput = document.getElementById("user-message-input");

const socket = io(
  config.BOT_SERVER_ENDPOINT,
  { transports: ['websocket', 'polling', 'flashsocket'] }
);

socket.on('bot-message', (data) => {
  console.log(data)
})

const INITIAL_MESSAGE = {
  user: BOT,
  id: Date.now(),
  message: initialBottyMessage
}

function scrollToBottomOfMessages() {
  const list = document.getElementById('message-list');

  list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
}

function Messages() {
  const [playSend] = useSound(config.SEND_AUDIO_URL);
  const [playReceive] = useSound(config.RECEIVE_AUDIO_URL);
  const { setLatestMessage } = useContext(LatestMessagesContext);
  const [botTyping, setIsTyping] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);

  const sendMessage = useCallback(() => {
    if (!message) { return }
    setMessages([...messages, { message, user: ME, id: Date.now() }])
    playSend();
    scrollToBottomOfMessages()
    socket.emit('user-message', message)
    setMessage('');
    document.getElementById('user-message-input').value = '';
  }, [message, messages])

  const onChangeMessage = ({ target: { value } }) => {
    setMessage(value);
  }

  useEffect(() => {
    socket.off('bot-message')
    socket.on('bot-message', (message) => {
      setIsTyping(false);

      setMessages([...messages, { message, user: BOT, id: Date.now() }]);

      setLatestMessage(BOT, message);

      playReceive();

      scrollToBottomOfMessages();
    });
  }, [messages])

  useEffect(() => {
    document.getElementById('user-message-input').focus()

    socket.on('bot-typing', () => {
      setIsTyping(true);
    });
  }, [])

  return (
    <div className="messages">
      <Header />
      <div className="messages__list" id="message-list">
        {messages.map((message, index) => {
          return <Message message={message} nextMessage={messages[index + 1]} botTyping={botTyping} />
        })}
      </div>
      <Footer message={message} sendMessage={sendMessage} onChangeMessage={onChangeMessage} />
    </div>
  );
}

export default Messages;
