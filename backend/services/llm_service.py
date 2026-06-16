"""
Unified LLM service with automatic multi-provider fallback.

Provider chain (auto mode):
  Groq → Gemini → HuggingFace → Anthropic

Each provider supports primary + fallback API keys where configured.
"""
from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator, Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger(__name__)

_RETRYABLE_PATTERNS = (
    "credit balance",
    "rate limit",
    "quota",
    "overloaded",
    "503",
    "502",
    "429",
    "invalid_request_error",
    "authentication",
    "api key",
    "unauthorized",
    "model_not_found",
)


def _is_retryable(exc: Exception) -> bool:
    msg = str(exc).lower()
    return any(p in msg for p in _RETRYABLE_PATTERNS)


def _clean_error(exc: Exception) -> str:
    """Return a user-friendly error string without raw API payloads."""
    raw = str(exc)
    if "credit balance" in raw.lower():
        return "Primary AI provider credits exhausted — switched to backup AI."
    if "429" in raw or "rate limit" in raw.lower():
        return "AI rate limit reached — please try again in a moment."
    # Strip JSON blobs from error messages
    if raw.startswith("{") or "Error code:" in raw:
        return "AI service temporarily unavailable. Backup providers are being used."
    return raw[:300]


class LLMService:
    def __init__(self) -> None:
        from config import settings
        self.settings = settings

    def _gemini_keys(self) -> List[str]:
        keys = []
        if self.settings.GEMINI_API_KEY:
            keys.append(self.settings.GEMINI_API_KEY)
        if self.settings.GEMINI_API_KEY_FALLBACK:
            keys.append(self.settings.GEMINI_API_KEY_FALLBACK)
        return keys

    def _hf_keys(self) -> List[str]:
        keys = []
        if self.settings.HUGGINGFACE_API_KEY:
            keys.append(self.settings.HUGGINGFACE_API_KEY)
        if self.settings.HUGGINGFACE_API_KEY_FALLBACK:
            keys.append(self.settings.HUGGINGFACE_API_KEY_FALLBACK)
        return keys

    async def chat(
        self,
        system_prompt: str,
        user_content: str,
        max_tokens: int = 2048,
    ) -> Tuple[str, str]:
        """Returns (response_text, provider_name)."""
        errors: List[str] = []
        chain = self._provider_chain()

        for provider in chain:
            try:
                text = await self._call_provider(provider, system_prompt, user_content, max_tokens)
                if text and text.strip():
                    logger.info(f"LLM response via {provider}")
                    return text.strip(), provider
            except Exception as e:
                logger.warning(f"LLM provider {provider} failed: {e}")
                errors.append(f"{provider}: {_clean_error(e)}")

        raise RuntimeError(
            "All AI providers failed. " + (" | ".join(errors[-3:]) if errors else "No providers configured.")
        )

    async def stream_chat(
        self,
        system_prompt: str,
        user_content: str,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Yield text chunks; falls back to single-shot on stream failure."""
        try:
            async for chunk in self._stream_groq(system_prompt, user_content, max_tokens):
                yield chunk
            return
        except Exception as e:
            logger.warning(f"Groq stream failed: {e}")

        try:
            text, provider = await self.chat(system_prompt, user_content, max_tokens)
            prefix = f"_Responding via {provider.replace('_', ' ').title()}_\n\n" if provider != "anthropic" else ""
            yield prefix + text
        except Exception as e:
            yield f"**Unable to generate a response.** {_clean_error(e)}"

    def _provider_chain(self) -> List[str]:
        order = getattr(self.settings, "LLM_PROVIDER_ORDER", "groq,gemini,huggingface,anthropic")
        configured = []
        for p in order.split(","):
            p = p.strip().lower()
            if p == "groq" and self.settings.GROQ_API_KEY:
                configured.append("groq")
            elif p == "gemini" and self._gemini_keys():
                configured.append("gemini")
            elif p == "huggingface" and self._hf_keys():
                configured.append("huggingface")
            elif p == "anthropic" and self.settings.ANTHROPIC_API_KEY:
                configured.append("anthropic")
        return configured or ["gemini", "huggingface"]

    async def _call_provider(
        self, provider: str, system: str, user: str, max_tokens: int
    ) -> str:
        if provider == "groq":
            return await self._call_groq(system, user, max_tokens)
        if provider == "gemini":
            return await self._call_gemini(system, user, max_tokens)
        if provider == "huggingface":
            return await self._call_huggingface(system, user, max_tokens)
        if provider == "anthropic":
            return await self._call_anthropic(system, user, max_tokens)
        raise ValueError(f"Unknown provider: {provider}")

    # ── Groq (OpenAI-compatible) ─────────────────────────────────────────────

    async def _call_groq(self, system: str, user: str, max_tokens: int) -> str:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": 0.4,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def _stream_groq(
        self, system: str, user: str, max_tokens: int
    ) -> AsyncIterator[str]:
        if not self.settings.GROQ_API_KEY:
            raise RuntimeError("Groq not configured")
        async with httpx.AsyncClient(timeout=90.0) as client:
            async with client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.settings.GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.GROQ_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": user},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": 0.4,
                    "stream": True,
                },
            ) as resp:
                resp.raise_for_status()
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    payload = line[6:].strip()
                    if payload == "[DONE]":
                        break
                    try:
                        chunk = json.loads(payload)
                        delta = chunk["choices"][0]["delta"].get("content", "")
                        if delta:
                            yield delta
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue

    # ── Google Gemini ────────────────────────────────────────────────────────

    async def _call_gemini(self, system: str, user: str, max_tokens: int) -> str:
        last_err: Optional[Exception] = None
        for key in self._gemini_keys():
            try:
                url = (
                    f"https://generativelanguage.googleapis.com/v1beta/models/"
                    f"{self.settings.GEMINI_MODEL}:generateContent"
                )
                async with httpx.AsyncClient(timeout=90.0) as client:
                    resp = await client.post(
                        url,
                        params={"key": key},
                        json={
                            "systemInstruction": {"parts": [{"text": system}]},
                            "contents": [{"role": "user", "parts": [{"text": user}]}],
                            "generationConfig": {
                                "maxOutputTokens": max_tokens,
                                "temperature": 0.4,
                            },
                        },
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    parts = data["candidates"][0]["content"]["parts"]
                    return "".join(p.get("text", "") for p in parts)
            except Exception as e:
                last_err = e
                if _is_retryable(e):
                    continue
                raise
        raise last_err or RuntimeError("Gemini failed")

    # ── HuggingFace Inference ────────────────────────────────────────────────

    async def _call_huggingface(self, system: str, user: str, max_tokens: int) -> str:
        from config import settings
        prompt = (
            f"<s>[INST] <<SYS>>\n{system}\n<</SYS>>\n\n"
            f"{user} [/INST]"
        )
        model = settings.HF_CHAT_MODEL
        last_err: Optional[Exception] = None

        for key in self._hf_keys():
            try:
                # Try OpenAI-compatible router first
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(
                        "https://router.huggingface.co/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": model,
                            "messages": [
                                {"role": "system", "content": system},
                                {"role": "user", "content": user[:6000]},
                            ],
                            "max_tokens": max_tokens,
                            "temperature": 0.4,
                        },
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        return data["choices"][0]["message"]["content"]

                    # Legacy inference API fallback
                    resp2 = await client.post(
                        f"https://api-inference.huggingface.co/models/{model}",
                        headers={"Authorization": f"Bearer {key}"},
                        json={
                            "inputs": prompt,
                            "parameters": {
                                "max_new_tokens": min(max_tokens, 1024),
                                "temperature": 0.4,
                                "return_full_text": False,
                            },
                        },
                    )
                    resp2.raise_for_status()
                    result = resp2.json()
                    if isinstance(result, list) and result:
                        return result[0].get("generated_text", "")
                    return str(result)
            except Exception as e:
                last_err = e
                logger.warning(f"HF key failed: {e}")
                continue
        raise last_err or RuntimeError("HuggingFace failed")

    # ── Anthropic ────────────────────────────────────────────────────────────

    async def _call_anthropic(self, system: str, user: str, max_tokens: int) -> str:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=self.settings.ANTHROPIC_API_KEY)
        response = await client.messages.create(
            model=self.settings.ANTHROPIC_MODEL,
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return response.content[0].text


_llm: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    global _llm
    if _llm is None:
        _llm = LLMService()
    return _llm
