import React, { useState } from 'react';

const App: React.FC = () => {
    const [messages, setMessages] = useState<{ sender: string, text: string }[]>([]);
    const [input, setInput] = useState('');
    const [model, setModel] = useState('gemini');

    const handleSend = () => {
        if (input.trim()) {
            setMessages([...messages, { sender: 'You', text: input }]);
            // TODO: Add logic to send message to the selected model
            setInput('');
        }
    };

    return (
        <div id="chat-container">
            <div id="model-selector-container">
                <label htmlFor="model-selector">Choose a model:</label>
                <select id="model-selector" value={model} onChange={e => setModel(e.target.value)}>
                    <option value="gemini">Gemini</option>
                    <option value="chatgpt">ChatGPT</option>
                    <option value="claude">Claude</option>
                </select>
            </div>
            <div id="chat-messages">
                {messages.map((msg, index) => (
                    <div key={index}><strong>{msg.sender}:</strong> {msg.text}</div>
                ))}
            </div>
            <div id="chat-input-container">
                <input
                    type="text"
                    id="chat-input"
                    placeholder="Type your message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                />
                <button id="chat-send-btn" onClick={handleSend}>Send</button>
            </div>
        </div>
    );
};

export default App;
