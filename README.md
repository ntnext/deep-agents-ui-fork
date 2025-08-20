# Deep Agents UI

Deep Agents are generic AI agents that are capable of handling tasks of varying complexity. This is a UI intended to be used alongside the [`deep-agents`](https://github.com/hwchase17/deepagents?ref=blog.langchain.com) package from LangChain.

If the term "Deep Agents" is new to you, check out these videos!
[What are Deep Agents?](https://www.youtube.com/watch?v=433SmtTc0TA)
[Implementing Deep Agents](https://www.youtube.com/watch?v=TTMYJAw5tiA&t=701s)

And check out this [video](https://youtu.be/0CE_BhdnZZI) for a walkthrough of this UI.

### Optional: Optimization Setup

You will need to connect to an optimizer graph by setting a few environment variables

```env
NEXT_PUBLIC_OPTIMIZATION_DEPLOYMENT_URL="https://deep-agent-optimizer-5189c7b205455d77b3dbaa42c4655916.us.langgraph.app"
NEXT_PUBLIC_LANGSMITH_API_KEY="lsv2_xxxx"
```

This will enable the Deep Agent Optimizer in the UI

### Starting the App

```env
NEXT_PUBLIC_DEPLOYMENT_URL="your agent server URL"
NEXT_PUBLIC_AGENT_ID=<your agent ID from langgraph.json>
NEXT_PUBLIC_LANGSMITH_API_KEY=<langsmith-api-key>
```

Once you have your environment variables set, install all dependencies and run your app.

Install all dependencies and run your app.

```bash
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to test out your deep agent!

### Connecting to a Deep Agent
When you open the app for the first time, you will be prompted to supply 2 required fields
- Agent Deployment URL: The URL for the agent that you are connecting to
- Assistant ID: The ID of the assistant or agent that you are looking to use and optimize against
- LangSmith API Key: Only required if you are looking to use or optimize a deployed graph

You can edit these at any time by clicking on the Settings cog.