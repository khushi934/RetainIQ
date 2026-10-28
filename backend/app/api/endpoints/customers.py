from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc, asc

from app.core.database import get_db
from app.models.entities import Customer, Workspace, Prediction, ModelVersion
from app.schemas.customer import CustomerResponse, CustomerListResponse, CustomerUpdate
from app.api.deps import get_current_workspace

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=CustomerListResponse)
def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=5, le=100),
    search: Optional[str] = Query(None, description="Search by customer identifier"),
    contract: Optional[str] = Query(None, description="Filter by contract type"),
    churn: Optional[bool] = Query(None, description="Filter by observed churn"),
    risk: Optional[str] = Query(None, description="Filter by risk tier (Low, Medium, High)"),
    sort_by: str = Query("id", description="Sort field: id, tenure_months, monthly_charges, customer_identifier"),
    sort_order: str = Query("asc", description="asc or desc"),
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve paginated customer directory with search, multi-factor filtering, and latest ML prediction scores."""
    stmt = select(Customer).where(Customer.workspace_id == workspace.id)

    if search and search.strip():
        term = f"%{search.strip()}%"
        stmt = stmt.where(Customer.customer_identifier.ilike(term))

    if contract and contract.strip():
        stmt = stmt.where(Customer.contract_type == contract.strip())

    if churn is not None:
        stmt = stmt.where(Customer.observed_churn == churn)

    # Count total matching
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0

    # Sorting
    sort_column = getattr(Customer, sort_by, Customer.id)
    if sort_order.lower() == "desc":
        stmt = stmt.order_by(desc(sort_column))
    else:
        stmt = stmt.order_by(asc(sort_column))

    offset = (page - 1) * page_size
    customers = db.scalars(stmt.offset(offset).limit(page_size)).all()

    # Fetch latest predictions for returned customers
    cust_ids = [c.id for c in customers]
    predictions_map = {}
    if cust_ids:
        preds = db.scalars(
            select(Prediction)
            .where(Prediction.customer_id.in_(cust_ids))
            .order_by(Prediction.id.desc())
        ).all()
        for p in preds:
            if p.customer_id not in predictions_map:
                predictions_map[p.customer_id] = p

    items = []
    for c in customers:
        item = CustomerResponse.model_validate(c)
        pred = predictions_map.get(c.id)
        if pred:
            item.latest_predicted_churn_probability = pred.predicted_churn_probability
            item.latest_risk_tier = pred.risk_tier
            item.top_contributing_factors = pred.top_contributing_factors
        items.append(item)

    # If risk filter requested
    if risk and risk.strip():
        items = [i for i in items if i.latest_risk_tier == risk.strip()]

    total_pages = max(1, (total + page_size - 1) // page_size)
    return CustomerListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer_profile(
    customer_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Retrieve detailed customer profile and their latest risk prediction."""
    customer = db.scalar(
        select(Customer).where(Customer.id == customer_id, Customer.workspace_id == workspace.id)
    )
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found in this workspace."
        )

    res = CustomerResponse.model_validate(customer)
    pred = db.scalar(
        select(Prediction)
        .where(Prediction.customer_id == customer.id)
        .order_by(Prediction.id.desc())
    )
    if pred:
        res.latest_predicted_churn_probability = pred.predicted_churn_probability
        res.latest_risk_tier = pred.risk_tier
        res.top_contributing_factors = pred.top_contributing_factors

    return res

@router.patch("/{customer_id}", response_model=CustomerResponse)
def update_customer_record(
    customer_id: int,
    req: CustomerUpdate,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Update editable attributes of customer record."""
    customer = db.scalar(
        select(Customer).where(Customer.id == customer_id, Customer.workspace_id == workspace.id)
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    if req.subscription_status is not None:
        customer.subscription_status = req.subscription_status
    if req.contract_type is not None:
        customer.contract_type = req.contract_type
    if req.monthly_charges is not None:
        customer.monthly_charges = req.monthly_charges
    if req.engagement_score is not None:
        customer.engagement_score = req.engagement_score

    db.commit()
    db.refresh(customer)
    return CustomerResponse.model_validate(customer)

@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer_record(
    customer_id: int,
    workspace: Workspace = Depends(get_current_workspace),
    db: Session = Depends(get_db)
):
    """Delete customer record and associated predictions from MySQL."""
    customer = db.scalar(
        select(Customer).where(Customer.id == customer_id, Customer.workspace_id == workspace.id)
    )
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
    db.delete(customer)
    db.commit()
    return None
