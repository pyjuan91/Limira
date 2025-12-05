from typing import Dict, Any, Optional
from app.core.config import settings
import json


class AIService:
    """Service for AI-powered patent draft generation"""

    def __init__(self):
        self.provider = settings.PRIMARY_LLM_PROVIDER

        if self.provider == "openai":
            import openai
            self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            self.model = "gpt-4-turbo-preview"
        elif self.provider == "anthropic":
            import anthropic
            self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
            self.model = "claude-3-opus-20240229"
        elif self.provider == "gemini":
            import google.generativeai as genai
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.client = genai.GenerativeModel('gemini-2.5-flash')
            self.model = "gemini-2.5-flash"
        else:
            raise ValueError(f"Unsupported LLM provider: {self.provider}")

    def generate_patent_draft(self, disclosure_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate structured patent draft from disclosure content

        Args:
            disclosure_content: Dictionary with keys like "problem", "solution", etc.

        Returns:
            Dictionary with patent sections: background, summary, detailed_description, claims
        """
        prompt = self._build_patent_prompt(disclosure_content)

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert patent attorney. Generate structured, professional patent draft sections from technical disclosures."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,  # Lower temperature for more consistent output
                )
                draft_text = response.choices[0].message.content

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                )
                draft_text = response.content[0].text

            # Parse AI response into structured sections
            sections = self._parse_draft_response(draft_text)
            return sections

        except Exception as e:
            raise Exception(f"AI generation failed: {str(e)}")

    def _build_patent_prompt(self, disclosure: Dict[str, Any]) -> str:
        """Build prompt for patent draft generation"""
        return f"""
Generate a structured patent application draft from the following technical disclosure.

DISCLOSURE CONTENT:
{json.dumps(disclosure, indent=2)}

Please generate the following sections:

1. BACKGROUND OF THE INVENTION
   - Describe the technical field
   - Explain the problem being solved
   - Mention any relevant prior art or existing solutions

2. SUMMARY OF THE INVENTION
   - Provide a concise overview of the invention
   - Highlight key features and advantages

3. DETAILED DESCRIPTION
   - Explain the invention in technical detail
   - Describe how it works step-by-step
   - Reference any drawings or figures mentioned

4. CLAIMS (Basic)
   - Draft 3-5 basic patent claims
   - Start with a broad independent claim
   - Add dependent claims for specific features

Return the response in this EXACT JSON format:
{{
  "background": "...",
  "summary": "...",
  "detailed_description": "...",
  "claims": ["Claim 1: ...", "Claim 2: ...", "Claim 3: ..."],
  "abstract": "..."
}}
"""

    def _parse_draft_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse AI response into structured sections

        Attempts to extract JSON from the response. If that fails,
        does basic text parsing.
        """
        try:
            # Try to find JSON in the response
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start >= 0 and end > start:
                json_str = response_text[start:end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass

        # Fallback: basic parsing if JSON extraction fails
        return {
            "background": self._extract_section(response_text, "BACKGROUND"),
            "summary": self._extract_section(response_text, "SUMMARY"),
            "detailed_description": self._extract_section(response_text, "DETAILED DESCRIPTION"),
            "claims": self._extract_claims(response_text),
            "abstract": self._extract_section(response_text, "ABSTRACT"),
        }

    def _extract_section(self, text: str, section_name: str) -> str:
        """Extract a section from markdown-style headers"""
        import re
        pattern = rf"#+\s*{section_name}[^\n]*\n(.*?)(?=\n#+\s|\Z)"
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        return match.group(1).strip() if match else ""

    def _extract_claims(self, text: str) -> list[str]:
        """Extract claims from text"""
        import re
        claims_section = self._extract_section(text, "CLAIMS")
        if not claims_section:
            return []

        # Find numbered claims
        claim_pattern = r"(?:Claim\s+)?(\d+)[.:]?\s*(.+?)(?=(?:Claim\s+)?\d+[.:]|\Z)"
        matches = re.findall(claim_pattern, claims_section, re.DOTALL)

        return [f"Claim {num}: {claim.strip()}" for num, claim in matches]

    def summarize_video_transcript(self, transcript: str) -> str:
        """
        Generate AI summary of video chat transcript

        Args:
            transcript: Full video call transcript

        Returns:
            Structured summary of invention discussion
        """
        prompt = f"""
Summarize the following invention discussion transcript. Focus on:
- Key technical points discussed
- New invention details revealed
- Questions raised and answered
- Action items or next steps

TRANSCRIPT:
{transcript}

Provide a concise, structured summary in markdown format.
"""

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",  # Cheaper model for summaries
                    messages=[
                        {"role": "system", "content": "You are a technical note-taker for patent discussions."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                )
                return response.choices[0].message.content

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-haiku-20240307",  # Cheaper model
                    max_tokens=1024,
                    messages=[{"role": "user", "content": prompt}],
                )
                return response.content[0].text

        except Exception as e:
            return f"Error generating summary: {str(e)}"

    def chat(self, messages: list[Dict[str, str]], system_prompt: Optional[str] = None) -> str:
        """
        Generate AI chat response from conversation history

        Args:
            messages: List of {"role": "user"|"assistant", "content": str}
            system_prompt: Optional system prompt to set behavior

        Returns:
            AI response string
        """
        try:
            if self.provider == "openai":
                chat_messages = []
                if system_prompt:
                    chat_messages.append({"role": "system", "content": system_prompt})
                chat_messages.extend(messages)

                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",  # Faster for chat
                    messages=chat_messages,
                    temperature=0.7,
                )
                return response.choices[0].message.content

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-haiku-20240307",  # Faster for chat
                    max_tokens=1024,
                    system=system_prompt or "You are a helpful patent drafting assistant.",
                    messages=messages,
                )
                return response.content[0].text

            elif self.provider == "gemini":
                # Gemini uses a different format - need to convert messages
                # For Gemini, we need to create a new model instance with system instruction
                import google.generativeai as genai

                # Create model with system instruction if provided
                if system_prompt:
                    model = genai.GenerativeModel(
                        'gemini-2.0-flash',
                        system_instruction=system_prompt
                    )
                else:
                    model = self.client

                # Build conversation history in Gemini format
                history = []
                for msg in messages[:-1]:  # All but the last message
                    history.append({
                        "role": "user" if msg["role"] == "user" else "model",
                        "parts": [msg["content"]]
                    })

                # Start chat with history
                chat = model.start_chat(history=history)

                # Send the latest message and get response
                if messages:
                    latest_message = messages[-1]["content"]
                    response = chat.send_message(latest_message)
                    return response.text
                else:
                    return "No message provided"

        except Exception as e:
            raise Exception(f"Chat generation failed: {str(e)}")

    def analyze_patent(self, patent_text: str, patent_number: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze a patent document and provide comprehensive insights

        Args:
            patent_text: Full text extracted from patent PDF
            patent_number: Optional patent number for reference

        Returns:
            Dictionary with analysis results including summary, technical assessment,
            commercial value, and recommendations
        """
        prompt = f"""
Analyze the following patent document and provide a comprehensive analysis.

PATENT NUMBER: {patent_number or "Not provided"}

PATENT TEXT:
{patent_text[:15000]}  # Limit to ~15k chars to avoid token limits

Please provide a detailed analysis in the following JSON format:
{{
  "summary": "A concise 2-3 sentence summary of what this patent covers",
  "technical_assessment": {{
    "innovation_level": "Revolutionary/Significant/Incremental/Minimal",
    "technical_complexity": "High/Medium/Low",
    "key_innovations": ["innovation 1", "innovation 2", "..."],
    "technical_field": "Primary field of technology",
    "implementation_difficulty": "High/Medium/Low"
  }},
  "commercial_value": {{
    "market_potential": "High/Medium/Low",
    "potential_applications": ["application 1", "application 2", "..."],
    "competitive_advantage": "Description of competitive advantages",
    "estimated_value_assessment": "Undervalued/Fairly Valued/Overvalued",
    "reasoning": "Why this patent might be undervalued or overvalued"
  }},
  "prior_art_landscape": {{
    "novelty_assessment": "Highly Novel/Moderately Novel/Incremental",
    "similar_technologies": ["technology 1", "technology 2", "..."],
    "differentiation_factors": ["factor 1", "factor 2", "..."]
  }},
  "strategic_insights": {{
    "licensing_potential": "High/Medium/Low",
    "enforcement_strength": "Strong/Moderate/Weak",
    "portfolio_fit": "Core Patent/Supporting Patent/Peripheral",
    "recommended_actions": ["action 1", "action 2", "..."]
  }},
  "claims_analysis": {{
    "total_claims": 0,
    "independent_claims": 0,
    "claim_scope": "Broad/Moderate/Narrow",
    "key_limitations": ["limitation 1", "limitation 2", "..."]
  }},
  "risk_assessment": {{
    "invalidation_risk": "High/Medium/Low",
    "design_around_difficulty": "Hard/Moderate/Easy",
    "potential_challenges": ["challenge 1", "challenge 2", "..."]
  }}
}}

Be objective and analytical. If the patent appears undervalued, explain why specifically.
"""

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model="gpt-4-turbo-preview",  # Use GPT-4 for complex analysis
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an expert patent analyst with deep expertise in technology assessment, IP valuation, and strategic patent analysis. Provide thorough, objective analysis."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    response_format={"type": "json_object"}
                )
                analysis_text = response.choices[0].message.content

            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model="claude-3-opus-20240229",  # Use Opus for complex analysis
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                )
                analysis_text = response.content[0].text

            elif self.provider == "gemini":
                response = self.client.generate_content(prompt)
                analysis_text = response.text

            # Parse JSON response
            try:
                start = analysis_text.find("{")
                end = analysis_text.rfind("}") + 1
                if start >= 0 and end > start:
                    json_str = analysis_text[start:end]
                    return json.loads(json_str)
            except json.JSONDecodeError:
                # Return raw text if JSON parsing fails
                return {
                    "summary": analysis_text[:500],
                    "raw_analysis": analysis_text,
                    "error": "Failed to parse structured analysis"
                }

        except Exception as e:
            raise Exception(f"Patent analysis failed: {str(e)}")


# Global AI service instance
ai_service = AIService()
