from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import Workspace
from app.schemas.report import AssistantQuestionRequest, AssistantAnswerResponse
from app.services.ai.assistant import RetainIQAnalystAssistant
from app.api.deps import get_current_workspace

router = APIRouter(prefix="/assistant", tags=["AI Investigation Assistant"])

@router.post("/ask", response_model=AssistantAnswerResponse)
def ask_assistant(
    req: AssistantQuestionRequest,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """
    Receive user question, gather verified MySQL context, and generate grounded answer.
    Falls back gracefully to deterministic rule-based explainer if LLM key is absent.
    """
    assistant = RetainIQAnalystAssistant(db)
    return assistant.answer_question(req, workspace.id)
