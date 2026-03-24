import { useEffect, useMemo, useState } from 'react';
import ChatShell from './components/ChatShell';
import ConfigCard from './components/ConfigCard';
import ExecutionSummary from './components/ExecutionSummary';
import ToolDrawer from './components/ToolDrawer';
import { checkHealth, fetchBootstrap, fetchToolRegistry, runAgent } from './lib/api';

const agentBaseDefault = import.meta.env.VITE_AGENT_BASE_URL || 'http://localhost:4000';
const apiBaseDefault = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function App() {
  const [agentBaseUrl, setAgentBaseUrl] = useState(agentBaseDefault);
  const [health, setHealth] = useState({ api: 'checking', agent: 'checking' });
  const [stage, setStage] = useState('loading');
  const [messages, setMessages] = useState([]);
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState({
    apiBaseUrl: apiBaseDefault,
    swaggerUrl: `${apiBaseDefault}/openapi.yaml`,
    maxRoutes: 4
  });

  useEffect(() => {
    hydratePage();
  }, [agentBaseUrl]);

  async function hydratePage() {
    setStage('loading');
    const [bootstrapRes, toolsRes, healthRes] = await Promise.allSettled([
      fetchBootstrap(agentBaseUrl),
      fetchToolRegistry(agentBaseUrl),
      checkHealth(apiBaseDefault, agentBaseUrl)
    ]);

    if (toolsRes.status === 'fulfilled') {
      setTools(toolsRes.value.tools || []);
    }

    if (healthRes.status === 'fulfilled') {
      setHealth(healthRes.value);
    }

    if (bootstrapRes.status === 'fulfilled') {
      const bootstrap = bootstrapRes.value;
      const apiDefault = bootstrap.component?.fields?.find(x => x.key === 'apiBaseUrl')?.defaultValue || apiBaseDefault;
      const swaggerDefault = bootstrap.component?.fields?.find(x => x.key === 'swaggerUrl')?.defaultValue || `${apiDefault}/openapi.yaml`;
      const maxRoutesDefault = bootstrap.component?.fields?.find(x => x.key === 'maxRoutes')?.defaultValue || 4;

      setConfig({ apiBaseUrl: apiDefault, swaggerUrl: swaggerDefault, maxRoutes: maxRoutesDefault });
      setMessages([
        {
          id: 'bootstrap-message',
          role: 'assistant',
          type: 'text',
          text: 'Welcome. I can work in conversation mode. First I need your Swagger URL and runtime metadata.'
        },
        {
          id: 'bootstrap-config',
          role: 'assistant',
          type: 'config',
          component: bootstrap.component
        }
      ]);
      setStage('collect_meta');
      return;
    }

    setMessages([
      {
        id: 'bootstrap-error',
        role: 'assistant',
        type: 'text',
        text: 'I could not load the bootstrap component from the agent server. Please check that the agent server is running.'
      }
    ]);
    setStage('error');
  }

  function handleConfigSubmit() {
    setMessages(prev => [
      ...prev,
      {
        id: `config-summary-${Date.now()}`,
        role: 'user',
        type: 'summary',
        text: `API Base URL: ${config.apiBaseUrl}\nSwagger URL: ${config.swaggerUrl}\nMax Routes: ${config.maxRoutes}`
      },
      {
        id: `prompt-request-${Date.now()}`,
        role: 'assistant',
        type: 'text',
        text: 'Configuration captured. Now tell me what you want to test.'
      }
    ]);
    setStage('collect_prompt');
  }

  async function handlePromptSubmit(text) {
    if (!text.trim()) return;

    setPrompt('');
    setLoading(true);
    setMessages(prev => [
      ...prev,
      { id: `user-prompt-${Date.now()}`, role: 'user', type: 'text', text },
      { id: `assistant-run-${Date.now()}`, role: 'assistant', type: 'text', text: 'Running the agent now. I will return a human-friendly summary after execution.' }
    ]);

    try {
      const result = await runAgent(agentBaseUrl, {
        prompt: text,
        apiBaseUrl: config.apiBaseUrl,
        swaggerUrl: config.swaggerUrl,
        maxRoutes: Number(config.maxRoutes),
        conversationMode: true
      });

      setMessages(prev => [
        ...prev,
        {
          id: `result-${Date.now()}`,
          role: 'assistant',
          type: 'result',
          result
        }
      ]);
      setStage('show_results');
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          type: 'text',
          text: error.message || 'The agent run failed.'
        }
      ]);
      setStage('collect_prompt');
    } finally {
      setLoading(false);
    }
  }

  const suggestions = useMemo(() => ([
    'Test the full loan workflow and explain each failed stage simply.',
    'Check whether invalid customer onboarding data is rejected.',
    'Review the payment flow and summarize validation issues for business users.'
  ]), []);

  return (
    <div className='min-h-screen bg-slate-100 text-slate-900'>
      <div className='mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[290px,1fr]'>
        <ToolDrawer
          health={health}
          tools={tools}
          agentBaseUrl={agentBaseUrl}
          setAgentBaseUrl={setAgentBaseUrl}
          postmanUrl={`${agentBaseUrl}/qa/postman-collection`}
        />

        <ChatShell
          title='System Functional Evaluation Agent'
          subtitle='Refactored to a conversation-first flow with config capture, prompt capture, human-friendly result cards, MCP-inspired tool registry, and Postman support.'
          messages={messages}
          composerValue={prompt}
          onComposerChange={setPrompt}
          onSend={() => handlePromptSubmit(prompt)}
          loading={loading}
          canSend={stage === 'collect_prompt' || stage === 'show_results'}
          suggestions={suggestions}
          onPickSuggestion={setPrompt}
          renderMessage={(message) => {
            if (message.type === 'config') {
              return (
                <ConfigCard
                  component={message.component}
                  config={config}
                  setConfig={setConfig}
                  onSubmit={handleConfigSubmit}
                />
              );
            }

            if (message.type === 'result') {
              return <ExecutionSummary result={message.result} />;
            }

            if (message.type === 'summary') {
              return <div className='whitespace-pre-line rounded-3xl bg-blue-600 px-4 py-3 text-sm text-white'>{message.text}</div>;
            }

            return (
              <div className={`max-w-3xl whitespace-pre-line rounded-3xl px-4 py-3 text-sm shadow-sm ${message.role === 'user' ? 'ml-auto bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
                {message.text}
              </div>
            );
          }}
        />
      </div>
    </div>
  );
}
