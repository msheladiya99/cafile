import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';
import { AssistantDocument } from '../models/AssistantDocument';
import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PROMPTS
// ─────────────────────────────────────────────────────────────────────────────

const MASTER_CA_SYSTEM_PROMPT = `You are **CA-GPT**, an elite AI assistant built exclusively for Chartered Accountants and tax professionals in India. You possess encyclopaedic knowledge of:

**STATUTORY KNOWLEDGE:**
- Income Tax Act, 1961 (all sections, schedules, proviso, and explanations up to the latest Finance Act)
- Income Tax Rules, 1962
- Goods and Services Tax (CGST/SGST/IGST Acts, 2017) + all Rules and Notifications
- Companies Act, 2013 + Rules
- TDS/TCS provisions (Sections 192–206CCA), rates, returns, and compliance deadlines
- FEMA, DTAA treaties (India's key bilateral treaties: US, UK, UAE, Singapore, Mauritius, etc.)
- SEBI Regulations, RBI Circulars relevant to CA practice
- ICAI Standards on Auditing (SA), Accounting Standards (AS/Ind AS)
- GST Council Notifications, CBDT Circulars, and recent Supreme Court / High Court rulings

**HOW YOU MUST ANSWER:**
Always structure your responses with rich markdown formatting using this exact structure (skip sections only if genuinely not applicable):

---

## 📌 Applicable Law / Section
State the precise section number, rule, or notification. Example: *Section 44AB, Income Tax Act, 1961* or *Rule 12 of Income Tax Rules*.

## 📖 Legal Provision (Plain Language)
Explain the provision in clear, professional language. Include:
- Exact threshold limits (with AY/FY reference if applicable)
- Due dates and deadlines
- Relevant exemptions or conditions

## 🔢 Computation / Working (if applicable)
Provide step-by-step computation with numbers. Use tables where appropriate.

| Particulars | Amount (₹) |
|---|---|
| ... | ... |

## ✅ Practical Compliance Steps
Numbered actionable checklist for the CA/taxpayer to follow.

## ⚠️ Risks & Penalties
State the exact penalty section, amount, and conditions. Example: *Section 271B — Penalty for failure to get accounts audited: ½% of turnover, max ₹1,50,000.*

## 💡 Tax Planning Tip (if applicable)
Offer a legitimate, ethical tax planning angle where possible.

## 📚 Key Case Laws / Circulars (if applicable)
Cite authoritative Supreme Court / ITAT / High Court rulings or CBDT circulars relevant to the query.

---

**STRICT RULES:**
1. Never fabricate section numbers or case citations. If unsure, state "Please verify from the bare act or latest CBDT circular."
2. Always mention the relevant Assessment Year (AY) or Financial Year (FY) for time-sensitive answers.
3. Use ₹ symbol for all monetary amounts. Use Indian number system (Lakh, Crore).
4. If the user's uploaded firm documents contain relevant data, prioritize that context and cite it explicitly as "[From Your Firm's Knowledge Base]".
5. For compliance deadlines, always flag if a date is near or has passed relative to the current date.
6. If a question is outside the CA/tax/audit domain, politely redirect: "This question is outside my CA domain. Let me help you with tax compliance, auditing, or related matters."`;

const DRAFT_MODE_SYSTEM_PROMPT = (draftType: string) => `You are **CA-GPT Draft Engine**, a specialist in generating professional, legally sound correspondence for Chartered Accountants in India.

**YOUR TASK:** Generate a complete, ready-to-send **${draftType}** that a senior CA can use with minimal editing.

**DOCUMENT QUALITY STANDARDS:**
- Use formal, professional legal English suitable for submission to tax authorities
- Include all statutory references (section numbers, rule numbers, notification numbers)
- Structure with proper headings: Date, Subject, Reference, Salutation, Body paragraphs, Prayer/Request, Closing
- Add [PLACEHOLDER] tags for client-specific details the CA must fill in (e.g., [PAN], [Client Name], [Amount])
- The document must be self-contained and legally precise
- For notice replies: acknowledge the notice, provide factual submissions, cite supporting provisions, and request relief

**OUTPUT FORMAT:**
\`\`\`
[LETTERHEAD]
[Firm Name]
[Firm Address]
Date: [DATE]

To,
[Addressee]
[Designation]
[Department / ITO Ward No.]

Subject: [Subject Line]

Reference: [Notice/Assessment Reference Number]

Sir/Madam,

[BODY - structured paragraphs with clear legal arguments]

Yours faithfully,

[CA Name]
[Membership No. / Firm Reg. No.]
[Firm Name]
\`\`\`

After the draft, add a section:
## 📎 Documents to Attach
List recommended supporting documents.

## ⚖️ Legal Basis
List all sections and case laws supporting the submissions in the draft.`;

// ─────────────────────────────────────────────────────────────────────────────

export class AssistantAiService {
    private openai: OpenAI;
    private pinecone: Pinecone | null = null;
    private indexName = process.env.PINECONE_INDEX || 'ca-assistant';

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
        this.openai = new OpenAI({
            apiKey: apiKey,
            baseURL: apiKey?.startsWith('sk-or') ? 'https://openrouter.ai/api/v1' : undefined,
        });

        if (process.env.PINECONE_API_KEY) {
            this.pinecone = new Pinecone({
                apiKey: process.env.PINECONE_API_KEY,
            });
        }
    }

    private getModelOptions() {
        if (process.env.OPENAI_API_KEY) {
            return { chatModel: 'gpt-4o', embedModel: 'text-embedding-3-small' };
        }
        return {
            chatModel: process.env.OPENROUTER_TAX_MODEL || 'openai/gpt-4o-mini',
            embedModel: 'text-embedding-3-small'
        };
    }

    /**
     * Chunk text into smaller pieces for embedding
     */
    private chunkText(text: string, chunkSize = 1000): string[] {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Process a document: Extract text, summarize, embed, and store in Pinecone
     */
    async processAndEmbedDocument(docId: string, textContext: string, firmId: string) {
        if (!this.pinecone) {
            console.warn('Pinecone not configured. Skipping embeddings.');
            return { summary: 'Pinecone not configured. Text saved in database only.' };
        }

        const { embedModel, chatModel } = this.getModelOptions();

        // 1. Generate Summary oriented for CA use
        const summaryRes = await this.openai.chat.completions.create({
            model: chatModel,
            messages: [{
                role: 'system',
                content: 'You are a CA expert. Summarize the given tax document concisely for quick reference.'
            }, {
                role: 'user',
                content: `Summarize this document in 3-5 bullet points highlighting:\n- Key sections/provisions mentioned\n- Compliance obligations\n- Deadlines or monetary thresholds\n- Impact for taxpayers/CA firms\n\nDocument:\n${textContext.substring(0, 4000)}`
            }],
            max_tokens: 500,
            temperature: 0.1,
        });
        const summary = summaryRes.choices[0].message.content || 'Summary generated.';

        // 2. Chunk & Embed
        try {
            const chunks = this.chunkText(textContext);
            const index = this.pinecone.index(this.indexName);

            const vectors = await Promise.all(chunks.map(async (chunk, i) => {
                const embedRes = await this.openai.embeddings.create({
                    model: embedModel,
                    input: chunk,
                });
                return {
                    id: `${docId}-${i}`,
                    values: embedRes.data[0].embedding,
                    metadata: {
                        docId,
                        firmId,
                        text: chunk
                    }
                };
            }));

            // 3. Store in Pinecone
            await index.upsert(vectors as any);
        } catch (e: any) {
            console.error('Embedding failed (Requires OPENAI_API_KEY):', e.message);
        }

        return { summary };
    }

    /**
     * Answer a CA query using RAG + Power System Prompt
     */
    async chatWithAssistant(messages: any[], firmId: string, customDraftMode?: string) {
        let retrievalContext = '';

        // Use the last user message as query for RAG
        const lastUserMessage = messages.slice().reverse().find((m: any) => m.role === 'user');

        if (this.pinecone && lastUserMessage) {
            try {
                const { embedModel } = this.getModelOptions();
                const embedRes = await this.openai.embeddings.create({
                    model: embedModel,
                    input: lastUserMessage.content,
                });

                const index = this.pinecone.index(this.indexName);
                const queryRes = await index.query({
                    vector: embedRes.data[0].embedding,
                    topK: 5, // Retrieve more context for richer answers
                    includeMetadata: true,
                    filter: { firmId: { $eq: firmId } }
                });

                if (queryRes.matches.length > 0 && queryRes.matches[0].score && queryRes.matches[0].score > 0.7) {
                    retrievalContext = '\n\n---\n## 📁 From Your Firm\'s Knowledge Base\n*The following context was retrieved from your uploaded firm documents:*\n\n' +
                        queryRes.matches
                            .filter(m => (m.score || 0) > 0.65)
                            .map((m, i) => `**[KB Doc ${i + 1}]** ${m.metadata?.text}`)
                            .join('\n\n---\n');
                }
            } catch (e: any) {
                console.error('RAG query failed:', e.message);
            }
        }

        // Choose the right system prompt
        const systemPrompt = customDraftMode
            ? DRAFT_MODE_SYSTEM_PROMPT(customDraftMode) + (retrievalContext ? `\n\n${retrievalContext}` : '')
            : MASTER_CA_SYSTEM_PROMPT + (retrievalContext ? `\n\n${retrievalContext}` : '');

        const finalMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const { chatModel } = this.getModelOptions();
        const res = await this.openai.chat.completions.create({
            model: chatModel,
            messages: finalMessages,
            temperature: 0.1,      // Very low for factual accuracy
            max_tokens: 2500,      // Allow full, complete responses
            frequency_penalty: 0.1, // Reduce repetition
            presence_penalty: 0.1,
        });

        return res.choices[0].message.content;
    }
}

export const assistantAiService = new AssistantAiService();
