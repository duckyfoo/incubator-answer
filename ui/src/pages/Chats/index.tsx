import React, { useEffect, useState } from 'react';

const Chats: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const prompt = 'life, the univers, and everything'; // Replace with your actual prompt

  useEffect(() => {
    const fetchChatCompletion = async () => {
      try {
        const response = await fetch(
          `/answer/api/v1/chat/completion?prompt=${encodeURIComponent(prompt)}`,
        );
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
  }, [prompt]); // Add prompt to the dependency array

  console.log(message); // Logs the message state

  return (
    <div>
      <div>{message}</div>
    </div>
  );
};

export default Chats;
