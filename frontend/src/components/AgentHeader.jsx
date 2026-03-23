export default function AgentHeader() {
    return (
        <div className="mb-4">
            <h1 className="text-3xl font-bold">
                System Functional Evaluation Agent
            </h1>
            <p className="text-gray-400 mt-2">
                This agent evaluates API systems based on your prompt.
                It selects endpoints, executes them, and explains results.
            </p>
        </div>
    );
}