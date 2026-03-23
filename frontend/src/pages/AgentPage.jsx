import AgentHeader from "../components/AgentHeader";
import AgentInfo from "../components/AgentInfo";
import Chat from "../components/Chat";

export default function AgentPage() {
    return (
        <div className="min-h-screen bg-black text-white p-6">
            <AgentHeader />
            <AgentInfo />
            <Chat />
        </div>
    );
}