import React, { useEffect, useState } from 'react';

const Chats: React.FC = () => {
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const eventSource = new EventSource(`/answer/api/v1/chat/completion`);

    eventSource.onopen = () => {
      console.log('Connection to server opened.');
    };

    eventSource.onmessage = (event) => {
      console.log('New message received:', event.data);
      const newChunk = event.data.replace(/\$NEWLINE\$/g, '\n');
      setMessage((prevMessage) => prevMessage + newChunk);
    };

    eventSource.onerror = (err) => {
      console.error('EventSource failed:', err);
      if (err instanceof Event) {
        console.error('Error details:', {
          type: err.type,
          url: eventSource.url,
          readyState: eventSource.readyState,
        });
      }
      eventSource.close();
    };

    return () => {
      eventSource.close();
      console.log('EventSource connection closed.');
    };
  }, []);

  return (
    <div>
      <div>{message}</div>
    </div>
  );
};

export default Chats;
