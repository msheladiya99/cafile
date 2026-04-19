import OpenAI from 'openai';

export interface TaxNoticeAIOutput {
    notice_classification: {
        type: 'Income Tax' | 'GST' | 'Other';
        section_or_act: string;
        authority: string;
        financial_year: string;
        assessment_year: string;
    };
    issue_analysis: {
        core_issue: string;
        legal_context: string;
        possible_reason: string;
    };
    reply_draft: {
        subject: string;
        letter_body: string;
        legal_references: string[];
    };
    supporting_documents: string[];
    compliance_strategy: {
        step_by_step: string[];
        portal_action: string;
    };
    risk_assessment: {
        level: 'Low' | 'Medium' | 'High';
        reason: string;
    };
    deadline_management: {
        due_date: string;
        urgency: 'Immediate' | 'Moderate' | 'Low';
    };
    ai_confidence_score: number;
}

class TaxNoticeAIService {
    private openRouter: OpenAI | null = null;

    constructor() {
        const key = process.env.OPENROUTER_API_KEY;
        if (key) {
            this.openRouter = new OpenAI({
                baseURL: 'https://openrouter.ai/api/v1',
                apiKey: key,
            });
        }
    }

    private ensureClient() {
        if (!this.openRouter) {
            throw new Error('OpenRouter key missing. Set OPENROUTER_API_KEY in environment.');
        }
    }

    async analyzeNotice(
        noticeText: string,
        opts?: { replyStyle?: 'Auto Reply' | 'Strong Legal Reply'; includeSimpleExplanation?: boolean }
    ): Promise<{ parsed: TaxNoticeAIOutput; raw: string; simpleExplanation: string }> {
        this.ensureClient();

        const style = opts?.replyStyle || 'Auto Reply';
        const styleInstruction =
            style === 'Strong Legal Reply'
                ? 'Draft assertive but still conservative legal arguments with explicit document-backed disclaimers.'
                : 'Draft practical conservative reply focused on factual clarification and compliance.';

        const systemPrompt = `You are a senior Chartered Accountant and Indian tax law expert with deep knowledge of:
* Income Tax Act, 1961
* GST Act, 2017
* Relevant Rules, Notifications, Circulars
* Legal drafting standards for notices and replies

You must generate legally safe, professional, and fact-based responses. Do NOT hallucinate sections or laws.`;

        const userPrompt = `Analyze this OCR notice text from Indian tax authorities and return STRICT JSON only:
{
  "notice_classification": {
    "type": "Income Tax / GST / Other",
    "section_or_act": "",
    "authority": "",
    "financial_year": "",
    "assessment_year": ""
  },
  "issue_analysis": {
    "core_issue": "",
    "legal_context": "",
    "possible_reason": ""
  },
  "reply_draft": {
    "subject": "",
    "letter_body": "",
    "legal_references": []
  },
  "supporting_documents": [],
  "compliance_strategy": {
    "step_by_step": [],
    "portal_action": ""
  },
  "risk_assessment": {
    "level": "Low / Medium / High",
    "reason": ""
  },
  "deadline_management": {
    "due_date": "",
    "urgency": "Immediate / Moderate / Low"
  },
  "ai_confidence_score": 0
}

Rules:
1. Do NOT generate fake legal sections
2. If unsure → say "Not clearly specified in notice"
3. Always maintain formal legal tone
4. Reply must be ready-to-send format
5. Prefer conservative/legal-safe language
6. Highlight compliance risk if ignored
7. Keep Indian jurisdiction only
8. ${styleInstruction}

OCR Notice Text:
${noticeText}`;

        const response = await this.openRouter!.chat.completions.create({
            model: process.env.OPENROUTER_TAX_MODEL || 'openai/gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            temperature: 0.1,
        });

        const raw = typeof response.choices[0]?.message?.content === 'string'
            ? response.choices[0].message.content
            : JSON.stringify(response.choices[0]?.message?.content || {});

        const parsedRaw = this.parseJSON(raw);
        const parsed = this.normalize(parsedRaw);

        let simpleExplanation = '';
        if (opts?.includeSimpleExplanation) {
            const simpleResp = await this.openRouter!.chat.completions.create({
                model: process.env.OPENROUTER_TAX_MODEL || 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'Explain Indian tax notices in plain language for clients. Avoid legal over-commitment.',
                    },
                    {
                        role: 'user',
                        content: `Explain this notice in simple language in 5 short bullet points and include what client should do next:
${noticeText}`,
                    },
                ],
                temperature: 0.1,
            });
            simpleExplanation = typeof simpleResp.choices[0]?.message?.content === 'string'
                ? simpleResp.choices[0].message.content.trim()
                : '';
        }

        return { parsed, raw, simpleExplanation };
    }

    private normalize(input: any): TaxNoticeAIOutput {
        const section = typeof input?.notice_classification?.section_or_act === 'string'
            ? input.notice_classification.section_or_act
            : 'Not clearly specified in notice';

        const typeRaw = String(input?.notice_classification?.type || 'Other');
        const type = typeRaw === 'Income Tax' || typeRaw === 'GST' ? typeRaw : 'Other';

        const riskRaw = String(input?.risk_assessment?.level || 'Medium');
        const riskLevel = riskRaw === 'Low' || riskRaw === 'High' ? riskRaw : 'Medium';

        const urgencyRaw = String(input?.deadline_management?.urgency || 'Moderate');
        const urgency = urgencyRaw === 'Immediate' || urgencyRaw === 'Low' ? urgencyRaw : 'Moderate';

        const scoreRaw = Number(input?.ai_confidence_score ?? 0);
        const score = Number.isFinite(scoreRaw) ? Math.max(0, Math.min(100, Math.round(scoreRaw))) : 0;

        return {
            notice_classification: {
                type,
                section_or_act: section || 'Not clearly specified in notice',
                authority: String(input?.notice_classification?.authority || 'Not clearly specified in notice'),
                financial_year: String(input?.notice_classification?.financial_year || ''),
                assessment_year: String(input?.notice_classification?.assessment_year || ''),
            },
            issue_analysis: {
                core_issue: String(input?.issue_analysis?.core_issue || ''),
                legal_context: String(input?.issue_analysis?.legal_context || ''),
                possible_reason: String(input?.issue_analysis?.possible_reason || ''),
            },
            reply_draft: {
                subject: String(input?.reply_draft?.subject || ''),
                letter_body: String(input?.reply_draft?.letter_body || ''),
                legal_references: Array.isArray(input?.reply_draft?.legal_references)
                    ? input.reply_draft.legal_references.map((x: any) => String(x))
                    : [],
            },
            supporting_documents: Array.isArray(input?.supporting_documents)
                ? input.supporting_documents.map((x: any) => String(x))
                : [],
            compliance_strategy: {
                step_by_step: Array.isArray(input?.compliance_strategy?.step_by_step)
                    ? input.compliance_strategy.step_by_step.map((x: any) => String(x))
                    : [],
                portal_action: String(input?.compliance_strategy?.portal_action || ''),
            },
            risk_assessment: {
                level: riskLevel,
                reason: String(input?.risk_assessment?.reason || ''),
            },
            deadline_management: {
                due_date: String(input?.deadline_management?.due_date || ''),
                urgency,
            },
            ai_confidence_score: score,
        };
    }

    private parseJSON(raw: string): any {
        const trimmed = raw.trim();
        try {
            return JSON.parse(trimmed);
        } catch {
            const fenced = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```([\s\S]*?)```/i);
            if (fenced?.[1]) return JSON.parse(fenced[1].trim());
            const l = trimmed.indexOf('{');
            const r = trimmed.lastIndexOf('}');
            if (l >= 0 && r > l) return JSON.parse(trimmed.slice(l, r + 1));
            throw new Error('AI response is not valid JSON');
        }
    }
}

export const taxNoticeAIService = new TaxNoticeAIService();
