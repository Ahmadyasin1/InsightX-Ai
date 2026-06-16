"""
HuggingFace Inference API client.

Provides free open-source AI capabilities as:
- Primary fallback when Anthropic API key is not configured
- Additional modalities: image captioning, zero-shot classification, summarization

All models use the free-tier HuggingFace Inference API — no GPU required locally.
"""
import logging
from typing import List, Optional

import httpx

logger = logging.getLogger(__name__)

HF_API_BASE = "https://api-inference.huggingface.co/models"
_DEFAULT_TIMEOUT = 90.0  # HF cold-start can be slow on free tier


class HuggingFaceService:
    """Async client for the HuggingFace Hosted Inference API."""

    _vision_disabled: bool = False

    def __init__(self, api_key: str = ""):
        self._api_key = api_key
        self._headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}

    @property
    def available(self) -> bool:
        return bool(self._api_key)

    async def _post(
        self,
        model: str,
        payload: dict,
        timeout: float = _DEFAULT_TIMEOUT,
    ) -> dict | list:
        url = f"{HF_API_BASE}/{model}"
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, json=payload, headers=self._headers)
            resp.raise_for_status()
            return resp.json()

    async def _post_binary(
        self,
        model: str,
        data: bytes,
        content_type: str = "image/jpeg",
        timeout: float = 30.0,
    ) -> dict | list:
        url = f"{HF_API_BASE}/{model}"
        headers = {**self._headers, "Content-Type": content_type}
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.post(url, content=data, headers=headers)
            resp.raise_for_status()
            return resp.json()

    # ── Text Generation / Chat ────────────────────────────────────────────────

    async def chat(
        self,
        prompt: str,
        model: Optional[str] = None,
        max_new_tokens: int = 1024,
        temperature: float = 0.7,
    ) -> str:
        """Generate text from a prompt using an instruction-tuned model."""
        from config import settings
        target_model = model or settings.HF_CHAT_MODEL
        result = await self._post(target_model, {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_new_tokens,
                "temperature": temperature,
                "do_sample": True,
                "return_full_text": False,
            },
        })
        if isinstance(result, list) and result:
            return result[0].get("generated_text", "")
        return str(result)

    async def chat_investigation(
        self,
        system_prompt: str,
        context: str,
        question: str,
        model: Optional[str] = None,
    ) -> str:
        """Mixtral / LLaMA 3 Instruct-formatted prompt for forensic queries."""
        formatted = (
            f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n"
            f"Context:\n{context[:2000]}\n\nQuestion: {question} [/INST]"
        )
        return await self.chat(formatted, model=model, max_new_tokens=2048)

    # ── Summarization ────────────────────────────────────────────────────────

    async def summarize(
        self,
        text: str,
        model: Optional[str] = None,
        max_length: int = 256,
        min_length: int = 64,
    ) -> str:
        """Abstractive summarization via BART-large-CNN."""
        from config import settings
        target_model = model or settings.HF_SUMMARIZATION_MODEL
        result = await self._post(target_model, {
            "inputs": text[:3000],
            "parameters": {"max_length": max_length, "min_length": min_length},
        })
        if isinstance(result, list) and result:
            return result[0].get("summary_text", "")
        return str(result)

    # ── Zero-Shot Text Classification ─────────────────────────────────────────

    async def classify_zero_shot(
        self,
        text: str,
        candidate_labels: List[str],
        model: Optional[str] = None,
    ) -> dict:
        """Classify text into candidate labels without task-specific training."""
        from config import settings
        target_model = model or settings.HF_CLASSIFY_MODEL
        return await self._post(target_model, {
            "inputs": text,
            "parameters": {"candidate_labels": candidate_labels},
        })

    # ── Image Captioning ─────────────────────────────────────────────────────

    async def caption_image(
        self,
        image_bytes: bytes,
        model: Optional[str] = None,
    ) -> str:
        """Generate a natural-language caption for a raw image."""
        from config import settings
        target_model = model or settings.HF_CAPTION_MODEL
        result = await self._post_binary(target_model, image_bytes)
        if isinstance(result, list) and result:
            return result[0].get("generated_text", "")
        return str(result)

    def caption_image_sync(
        self,
        image_bytes: bytes,
        model: Optional[str] = None,
        timeout: float = 60.0,
    ) -> str:
        """Synchronous BLIP captioning for use inside Detectra's sync pipeline."""
        from config import settings
        target_model = model or settings.HF_CAPTION_MODEL
        url = f"{HF_API_BASE}/{target_model}"
        with httpx.Client(timeout=timeout) as client:
            resp = client.post(
                url,
                content=image_bytes,
                headers={**self._headers, "Content-Type": "image/jpeg"},
            )
            resp.raise_for_status()
            result = resp.json()
        if isinstance(result, list) and result:
            return str(result[0].get("generated_text", "")).strip()
        if isinstance(result, dict):
            return str(result.get("generated_text", result.get("caption", ""))).strip()
        return str(result).strip()

    async def analyze_frame_vlm(
        self,
        image_bytes: bytes,
        prompt: str = "Describe this surveillance video frame in forensic detail.",
        model: Optional[str] = None,
    ) -> str:
        """Vision-language analysis via HuggingFace router (free-tier VLM)."""
        from config import settings
        import base64

        target_model = model or getattr(settings, "HF_VLM_MODEL", "Qwen/Qwen2-VL-2B-Instruct")
        b64 = base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "model": target_model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                ],
            }],
            "max_tokens": 256,
            "temperature": 0.2,
        }
        async with httpx.AsyncClient(timeout=120.0) as client:
            resp = await client.post(
                "https://router.huggingface.co/v1/chat/completions",
                json=payload,
                headers={**self._headers, "Content-Type": "application/json"},
            )
            resp.raise_for_status()
            data = resp.json()
        choices = data.get("choices") or []
        if choices:
            return str(choices[0].get("message", {}).get("content", "")).strip()
        return ""

    def analyze_frame_vlm_sync(
        self,
        image_bytes: bytes,
        prompt: str = "Describe this surveillance video frame in forensic detail.",
        model: Optional[str] = None,
    ) -> str:
        """Sync frame analysis — BLIP caption first, optional VLM router enrichment."""
        from config import settings

        if not self.available or self._vision_disabled:
            return ""

        # BLIP via inference API is more reliable on free tier than the vision router.
        try:
            caption = self.caption_image_sync(image_bytes)
            if caption:
                return caption
        except Exception as e:
            logger.debug(f"BLIP caption failed: {e}")

        target_model = model or getattr(settings, "HF_VLM_MODEL", "Qwen/Qwen2-VL-2B-Instruct")
        import base64

        b64 = base64.b64encode(image_bytes).decode("ascii")
        payload = {
            "model": target_model,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}},
                ],
            }],
            "max_tokens": 256,
            "temperature": 0.2,
        }
        try:
            with httpx.Client(timeout=120.0) as client:
                resp = client.post(
                    "https://router.huggingface.co/v1/chat/completions",
                    json=payload,
                    headers={**self._headers, "Content-Type": "application/json"},
                )
                resp.raise_for_status()
                data = resp.json()
            choices = data.get("choices") or []
            if choices:
                text = str(choices[0].get("message", {}).get("content", "")).strip()
                if text:
                    return text
        except Exception as e:
            HuggingFaceService._vision_disabled = True
            logger.warning(f"Vision APIs unavailable — skipping VLM enhancement: {e}")
        return ""

    # ── Investigation-specific helpers ────────────────────────────────────────

    async def classify_anomaly_severity(self, description: str) -> str:
        """Return a severity level for an anomaly description."""
        labels = ["critical", "high", "medium", "low", "informational"]
        try:
            result = await self.classify_zero_shot(description, labels)
            if isinstance(result, dict) and result.get("labels"):
                return result["labels"][0]
        except Exception as e:
            logger.warning(f"classify_anomaly_severity failed: {e}")
        return "medium"

    async def generate_incident_tags(self, description: str) -> List[str]:
        """Return relevant incident tags (score > 0.1) for a description."""
        labels = [
            "violence", "loitering", "trespassing", "theft", "fire",
            "crowd_formation", "traffic_incident", "medical_emergency",
            "suspicious_behavior", "vandalism", "unauthorized_access",
        ]
        try:
            result = await self.classify_zero_shot(description, labels)
            if isinstance(result, dict) and result.get("labels") and result.get("scores"):
                return [
                    lbl for lbl, score
                    in zip(result["labels"], result["scores"])
                    if score > 0.1
                ]
        except Exception as e:
            logger.warning(f"generate_incident_tags failed: {e}")
        return []

    async def enrich_executive_brief(self, brief: str) -> str:
        """Expand a terse AI-generated brief into a paragraph for the report."""
        prompt = (
            "<s>[INST] You are a forensic analyst. Expand the following brief "
            "incident summary into a professional 2-3 sentence paragraph suitable "
            f"for a police report:\n\n{brief} [/INST]"
        )
        try:
            return await self.chat(prompt, max_new_tokens=256, temperature=0.4)
        except Exception as e:
            logger.warning(f"enrich_executive_brief failed: {e}")
            return brief


def get_hf_service() -> HuggingFaceService:
    from config import settings
    key = settings.HUGGINGFACE_API_KEY or settings.HUGGINGFACE_API_KEY_FALLBACK
    return HuggingFaceService(api_key=key)
