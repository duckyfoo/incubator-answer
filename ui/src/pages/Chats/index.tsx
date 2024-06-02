import React, { useEffect, useState } from 'react';

const Chats: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const prompt = 'are you ready?'; // Replace with your actual prompt

  useEffect(() => {
    const eventSource = new EventSource(
      `/answer/api/v1/chat/completion?prompt=${encodeURIComponent(prompt)}`,
    );

    eventSource.addEventListener('error', () => eventSource.close());

    eventSource.addEventListener('token', (event: MessageEvent) => {
      setMessage((prevMessage) => prevMessage + event.data);
    });

    return () => {
      eventSource.close();
    };
  }, [prompt]);

  return (
    <div>
      <div>{message}</div>
    </div>
  );
};

export default Chats;
