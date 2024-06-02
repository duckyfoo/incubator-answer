import React, { useEffect, useState } from 'react';

const Chats: React.FC = () => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchChatCompletion = async () => {
      try {
        const response = await fetch(`/answer/api/v1/chat/completion`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setMessage(result.data); // Set message to the data element of the response
      } catch (error) {
        console.error('Fetch error:', error);
      }
    };

    fetchChatCompletion();
  }, []); // Empty dependency array means this runs once after the initial render

  console.log(message); // Logs the message state

  return (
    <div>
      <div>{message}</div>
    </div>
  );
};

export default Chats;
