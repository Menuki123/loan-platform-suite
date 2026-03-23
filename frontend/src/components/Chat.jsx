import { useState } from "react";

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const sendMessage = async () => {
        if (!input) return;

        const userMsg = { role: "user", text: input };

        setMessages((prev) => [...prev, userMsg]);

        // Call your agent API
        const res = await fetch("http://localhost:4000/qa/run", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: input
            })
        });

        const data = await res.json();

        const agentMsg = {
            role: "agent",
            text: `
Summary: ${data.summary?.decision || "N/A"}
Reasoning: ${data.summary?.reasoning || "No reasoning"}
      `
        };

        setMessages((prev) => [...prev, agentMsg]);
        setInput("");
    };

    return (
        <div>

            {/* Chat Area */}
            <div className="bg-gray-900 p-4 rounded-xl h-[300px] overflow-y-auto">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`p-2 my-2 rounded-xl ${msg.role === "user"
                                ? "bg-blue-600 text-white text-right"
                                : "bg-gray-700 text-white text-left"
                            }`}
                    >
                        {msg.text}
                    </div>
                ))}
            </div>

            {/* Input */}
            <div className="flex mt-3">
                <input
                    className="flex-1 p-3 bg-gray-800 rounded-l-xl"
                    placeholder="Ask the agent to evaluate something..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button
                    onClick={sendMessage}
                    className="bg-blue-600 px-4 rounded-r-xl"
                >
                    Send
                </button>
            </div>

        </div>
    );
}