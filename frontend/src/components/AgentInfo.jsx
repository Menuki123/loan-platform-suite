export default function AgentInfo() {
    return (
        <div className="grid grid-cols-2 gap-4 mb-4">

            <div className="bg-gray-800 p-4 rounded-xl">
                <h2 className="font-semibold mb-2">Tools</h2>
                <ul className="text-sm space-y-1">
                    <li>Swagger Loader</li>
                    <li>Route Planner</li>
                    <li>Payload Generator</li>
                    <li>API Executor</li>
                    <li>Response Evaluator</li>
                </ul>
            </div>

            <div className="bg-gray-800 p-4 rounded-xl">
                <h2 className="font-semibold mb-2">Resources</h2>
                <ul className="text-sm space-y-1">
                    <li>API Base URL</li>
                    <li>Swagger/OpenAPI</li>
                    <li>Environment Config</li>
                </ul>
            </div>

        </div>
    );
}