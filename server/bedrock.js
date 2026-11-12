// Amazon Bedrock Converse API using a Bedrock API key (bearer token).
const REGION = process.env.AWS_REGION || 'us-east-1';
export const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-6';

/**
 * messages: Bedrock Converse messages ([{ role, content: [{ text } | { image } | { toolUse } | { toolResult }] }])
 * tools: [{ name, description, schema }]   toolChoice: 'auto' | 'any' | toolName
 */
export async function converse({ system, messages, tools, toolChoice, maxTokens = 2048, temperature = 0.3 }) {
  const body = {
    messages,
    inferenceConfig: { maxTokens, temperature },
  };
  if (system) body.system = [{ text: system }];
  if (tools?.length) {
    body.toolConfig = {
      tools: tools.map((t) => ({ toolSpec: { name: t.name, description: t.description, inputSchema: { json: t.schema } } })),
    };
    if (toolChoice === 'any') body.toolConfig.toolChoice = { any: {} };
    else if (toolChoice && toolChoice !== 'auto') body.toolConfig.toolChoice = { tool: { name: toolChoice } };
  }
  const r = await fetch(`https://bedrock-runtime.${REGION}.amazonaws.com/model/${encodeURIComponent(MODEL_ID)}/converse`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.AMAZON_BEDROCK_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (!r.ok) throw new Error(`Bedrock ${r.status}: ${json.message || JSON.stringify(json)}`);
  return json; // { output: { message }, stopReason, usage }
}

export const imageBlock = (buffer, mime) => ({
  image: { format: (mime.split('/')[1] || 'jpeg').replace('jpg', 'jpeg'), source: { bytes: buffer.toString('base64') } },
});
