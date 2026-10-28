import io
import csv
import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.entities import Dataset, DataImportJob, Customer, AuditEvent
from app.schemas.dataset import (
    ColumnMapping, CSVPreviewResponse, CSVImportValidationResponse,
    ValidationErrorDetail, DataQualityReport
)

logger = logging.getLogger("retainiq.import")

# Standard column aliases for heuristic auto-mapping
COLUMN_ALIASES = {
    "customer_identifier": ["customerid", "customer_id", "cust_id", "id", "client_id", "account_id"],
    "tenure_months": ["tenure", "tenure_months", "months_active", "subscription_months"],
    "monthly_charges": ["monthlycharges", "monthly_charges", "monthly_fee", "monthly_amount", "mrr"],
    "total_charges": ["totalcharges", "total_charges", "total_revenue", "lifetime_value", "ltv"],
    "contract_type": ["contract", "contract_type", "term", "plan_type"],
    "observed_churn": ["churn", "churned", "is_churn", "churn_label", "churn_status"],
    "internet_service": ["internetservice", "internet_service", "internet_type"],
    "payment_method": ["paymentmethod", "payment_method", "billing_method"],
    "subscription_status": ["subscriptionstatus", "subscription_status", "status", "account_status"],
    "last_activity_date": ["lastactivitydate", "last_activity_date", "activity_date", "last_seen"],
    "engagement_score": ["engagementscore", "engagement_score", "activity_score", "usage_score"],
    "gender": ["gender", "sex"],
    "senior_citizen": ["seniorcitizen", "senior_citizen", "is_senior"],
    "partner": ["partner", "has_partner"],
    "dependents": ["dependents", "has_dependents"],
    "phone_service": ["phoneservice", "phone_service", "has_phone"],
    "multiple_lines": ["multiplelines", "multiple_lines"],
    "online_security": ["onlinesecurity", "online_security"],
    "online_backup": ["onlinebackup", "online_backup"],
    "device_protection": ["deviceprotection", "device_protection"],
    "tech_support": ["techsupport", "tech_support"],
    "streaming_tv": ["streamingtv", "streaming_tv"],
    "streaming_movies": ["streamingmovies", "streaming_movies"],
    "paperless_billing": ["paperlessbilling", "paperless_billing"],
}

def auto_suggest_mapping(csv_headers: List[str]) -> Dict[str, str]:
    """Auto-map detected CSV headers to RetainIQ schema fields."""
    mapping = {}
    normalized = {h.lower().replace(" ", "").replace("_", "").replace("-", ""): h for h in csv_headers}
    
    for field, aliases in COLUMN_ALIASES.items():
        matched = None
        for alias in aliases:
            cleaned_alias = alias.lower().replace("_", "")
            if cleaned_alias in normalized:
                matched = normalized[cleaned_alias]
                break
        if matched:
            mapping[field] = matched
        else:
            # Check if direct name match
            if field in csv_headers:
                mapping[field] = field
    return mapping

class CSVImportService:
    def __init__(self, db: Session):
        self.db = db

    def preview_csv_content(self, content_bytes: bytes, filename: str) -> CSVPreviewResponse:
        """Preview first rows of CSV and suggest column mappings."""
        # Try decoding with utf-8, fallback to latin-1
        try:
            text = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = content_bytes.decode("latin-1")
            
        stream = io.StringIO(text)
        sample = text[:4096]
        
        # Sniff delimiter
        try:
            sniffer = csv.Sniffer()
            dialect = sniffer.sniff(sample)
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","
            
        stream.seek(0)
        reader = csv.DictReader(stream, delimiter=delimiter)
        headers = reader.fieldnames or []
        
        preview_rows = []
        for i, row in enumerate(reader):
            if i >= 10:
                break
            preview_rows.append(row)
            
        suggested = auto_suggest_mapping(headers)
        
        return CSVPreviewResponse(
            filename=filename,
            file_size_bytes=len(content_bytes),
            detected_columns=headers,
            suggested_mapping=suggested,
            preview_rows=preview_rows,
            total_preview_count=len(preview_rows)
        )

    def validate_csv(
        self, 
        content_bytes: bytes, 
        mapping: ColumnMapping,
        workspace_id: int
    ) -> Tuple[CSVImportValidationResponse, List[Dict[str, Any]], List[ValidationErrorDetail]]:
        """
        Validate every row in the CSV file against domain rules and schema.
        Returns validation response, list of parsed clean records, and error list.
        """
        try:
            text = content_bytes.decode("utf-8")
        except UnicodeDecodeError:
            text = content_bytes.decode("latin-1")

        stream = io.StringIO(text)
        # Sniff delimiter
        try:
            dialect = csv.Sniffer().sniff(text[:4096])
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ","

        stream.seek(0)
        reader = csv.DictReader(stream, delimiter=delimiter)
        
        valid_records: List[Dict[str, Any]] = []
        errors: List[ValidationErrorDetail] = []
        seen_ids_in_file = set()
        
        # Check existing customer IDs in this workspace for duplicates
        existing_workspace_cids = set(
            self.db.scalars(
                select(Customer.customer_identifier).where(Customer.workspace_id == workspace_id)
            ).all()
        )

        for row_idx, row in enumerate(reader, start=2): # 1-indexed, row 1 is header
            row_errors: List[ValidationErrorDetail] = []
            
            # 1. Customer Identifier (Required)
            raw_cid = row.get(mapping.customer_identifier, "").strip() if mapping.customer_identifier in row else ""
            if not raw_cid:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    customer_identifier=None,
                    field_name=mapping.customer_identifier,
                    invalid_value="",
                    reason="Customer identifier is required and cannot be empty."
                ))
            elif raw_cid in seen_ids_in_file:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    customer_identifier=raw_cid,
                    field_name=mapping.customer_identifier,
                    invalid_value=raw_cid,
                    reason=f"Duplicate Customer ID '{raw_cid}' found within this CSV upload."
                ))
            elif raw_cid in existing_workspace_cids:
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    customer_identifier=raw_cid,
                    field_name=mapping.customer_identifier,
                    invalid_value=raw_cid,
                    reason=f"Customer ID '{raw_cid}' already exists in this workspace."
                ))
            else:
                seen_ids_in_file.add(raw_cid)

            # 2. Tenure
            tenure_val = 0
            raw_tenure = row.get(mapping.tenure_months, "").strip() if mapping.tenure_months in row else ""
            if raw_tenure != "":
                try:
                    tenure_val = int(float(raw_tenure))
                    if tenure_val < 0:
                        row_errors.append(ValidationErrorDetail(
                            row_number=row_idx,
                            customer_identifier=raw_cid,
                            field_name=mapping.tenure_months,
                            invalid_value=raw_tenure,
                            reason="Tenure months must be a non-negative number."
                        ))
                except ValueError:
                    row_errors.append(ValidationErrorDetail(
                        row_number=row_idx,
                        customer_identifier=raw_cid,
                        field_name=mapping.tenure_months,
                        invalid_value=raw_tenure,
                        reason="Tenure could not be parsed as a numeric integer."
                    ))

            # 3. Monthly Charges
            monthly_val = 0.0
            raw_monthly = row.get(mapping.monthly_charges, "").strip() if mapping.monthly_charges in row else ""
            if raw_monthly != "":
                try:
                    monthly_val = float(raw_monthly)
                    if monthly_val < 0:
                        row_errors.append(ValidationErrorDetail(
                            row_number=row_idx,
                            customer_identifier=raw_cid,
                            field_name=mapping.monthly_charges,
                            invalid_value=raw_monthly,
                            reason="Monthly charges cannot be negative."
                        ))
                except ValueError:
                    row_errors.append(ValidationErrorDetail(
                        row_number=row_idx,
                        customer_identifier=raw_cid,
                        field_name=mapping.monthly_charges,
                        invalid_value=raw_monthly,
                        reason="Monthly charges must be a valid decimal number."
                    ))

            # 4. Total Charges
            total_val = 0.0
            raw_total = row.get(mapping.total_charges, "").strip() if mapping.total_charges in row else ""
            if raw_total != "":
                try:
                    total_val = float(raw_total)
                    if total_val < 0:
                        row_errors.append(ValidationErrorDetail(
                            row_number=row_idx,
                            customer_identifier=raw_cid,
                            field_name=mapping.total_charges,
                            invalid_value=raw_total,
                            reason="Total charges cannot be negative."
                        ))
                except ValueError:
                    # Sometimes total charges is blank or space in telco datasets
                    total_val = round(monthly_val * tenure_val, 2)

            # 5. Observed Churn Label
            observed_churn = False
            raw_churn = row.get(mapping.observed_churn, "").strip().lower() if mapping.observed_churn in row else ""
            if raw_churn in ["yes", "true", "1", "churned"]:
                observed_churn = True
            elif raw_churn in ["no", "false", "0", "active", "retained"]:
                observed_churn = False
            elif raw_churn != "":
                row_errors.append(ValidationErrorDetail(
                    row_number=row_idx,
                    customer_identifier=raw_cid,
                    field_name=mapping.observed_churn,
                    invalid_value=row.get(mapping.observed_churn),
                    reason="Churn value must be Yes/No, True/False, or 1/0."
                ))

            # 6. Activity Date
            activity_dt = None
            if mapping.last_activity_date and mapping.last_activity_date in row:
                raw_date = row.get(mapping.last_activity_date, "").strip()
                if raw_date:
                    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%m/%d/%Y", "%d-%m-%Y", "%Y-%m-%d %H:%M:%S"):
                        try:
                            activity_dt = datetime.strptime(raw_date, fmt)
                            break
                        except ValueError:
                            pass
                    if not activity_dt:
                        row_errors.append(ValidationErrorDetail(
                            row_number=row_idx,
                            customer_identifier=raw_cid,
                            field_name=mapping.last_activity_date,
                            invalid_value=raw_date,
                            reason="Activity date must be a valid date in YYYY-MM-DD or standard date format."
                        ))

            # 7. Engagement score
            engagement_score = None
            if mapping.engagement_score and mapping.engagement_score in row:
                raw_eng = row.get(mapping.engagement_score, "").strip()
                if raw_eng:
                    try:
                        engagement_score = float(raw_eng)
                    except ValueError:
                        row_errors.append(ValidationErrorDetail(
                            row_number=row_idx,
                            customer_identifier=raw_cid,
                            field_name=mapping.engagement_score,
                            invalid_value=raw_eng,
                            reason="Engagement score must be numeric (e.g. 0-100)."
                        ))

            # If row had errors, collect them and do not accept row
            if row_errors:
                errors.extend(row_errors)
            else:
                # Clean parsed record
                senior_bool = False
                if mapping.senior_citizen and mapping.senior_citizen in row:
                    raw_sen = str(row.get(mapping.senior_citizen, "")).strip().lower()
                    senior_bool = raw_sen in ["1", "yes", "true"]

                status = row.get(mapping.subscription_status, "").strip() if mapping.subscription_status and mapping.subscription_status in row else ("Churned" if observed_churn else "Active")
                if not status:
                    status = "Churned" if observed_churn else "Active"

                record = {
                    "workspace_id": workspace_id,
                    "customer_identifier": raw_cid,
                    "gender": row.get(mapping.gender, "").strip() if mapping.gender and mapping.gender in row else None,
                    "senior_citizen": senior_bool,
                    "partner": row.get(mapping.partner, "").strip() if mapping.partner and mapping.partner in row else None,
                    "dependents": row.get(mapping.dependents, "").strip() if mapping.dependents and mapping.dependents in row else None,
                    "tenure_months": tenure_val,
                    "phone_service": row.get(mapping.phone_service, "").strip() if mapping.phone_service and mapping.phone_service in row else None,
                    "multiple_lines": row.get(mapping.multiple_lines, "").strip() if mapping.multiple_lines and mapping.multiple_lines in row else None,
                    "internet_service": row.get(mapping.internet_service, "").strip() if mapping.internet_service and mapping.internet_service in row else None,
                    "online_security": row.get(mapping.online_security, "").strip() if mapping.online_security and mapping.online_security in row else None,
                    "online_backup": row.get(mapping.online_backup, "").strip() if mapping.online_backup and mapping.online_backup in row else None,
                    "device_protection": row.get(mapping.device_protection, "").strip() if mapping.device_protection and mapping.device_protection in row else None,
                    "tech_support": row.get(mapping.tech_support, "").strip() if mapping.tech_support and mapping.tech_support in row else None,
                    "streaming_tv": row.get(mapping.streaming_tv, "").strip() if mapping.streaming_tv and mapping.streaming_tv in row else None,
                    "streaming_movies": row.get(mapping.streaming_movies, "").strip() if mapping.streaming_movies and mapping.streaming_movies in row else None,
                    "contract_type": row.get(mapping.contract_type, "Month-to-month").strip() if mapping.contract_type and mapping.contract_type in row else "Month-to-month",
                    "paperless_billing": row.get(mapping.paperless_billing, "").strip() if mapping.paperless_billing and mapping.paperless_billing in row else None,
                    "payment_method": row.get(mapping.payment_method, "").strip() if mapping.payment_method and mapping.payment_method in row else None,
                    "monthly_charges": monthly_val,
                    "total_charges": total_val,
                    "subscription_status": status,
                    "last_activity_date": activity_dt or datetime.now(timezone.utc),
                    "engagement_score": engagement_score,
                    "observed_churn": observed_churn
                }
                valid_records.append(record)

        total_inspected = len(valid_records) + len(set(e.row_number for e in errors))
        unique_error_rows = len(set(e.row_number for e in errors))
        duplicate_ids_count = sum(1 for e in errors if "Duplicate" in e.reason or "already exists" in e.reason)

        validation_result = CSVImportValidationResponse(
            can_import=len(valid_records) > 0,
            total_rows_inspected=total_inspected,
            valid_rows_count=len(valid_records),
            invalid_rows_count=unique_error_rows,
            duplicate_id_count=duplicate_ids_count,
            errors=errors[:100]  # Cap at 100 for concise payload
        )
        return validation_result, valid_records, errors

    def execute_import(
        self,
        workspace_id: int,
        dataset_name: str,
        filename: str,
        content_bytes: bytes,
        mapping: ColumnMapping,
        user_id: Optional[int] = None
    ) -> Tuple[Dataset, DataImportJob, DataQualityReport]:
        """
        Execute full transactional import into MySQL database.
        Returns created Dataset, DataImportJob, and DataQualityReport.
        """
        validation_result, valid_records, errors = self.validate_csv(content_bytes, mapping, workspace_id)
        
        now = datetime.now(timezone.utc)
        
        try:
            # 1. Create Dataset record
            dataset = Dataset(
                workspace_id=workspace_id,
                name=dataset_name,
                filename=filename,
                file_size_bytes=len(content_bytes),
                row_count=len(valid_records),
                column_count=len(mapping.model_dump()),
                status="imported" if valid_records else "failed",
                churn_definition="Observed historical churn label (Churn == Yes)",
                summary_metadata={
                    "total_rows_in_file": validation_result.total_rows_inspected,
                    "accepted_rows": len(valid_records),
                    "rejected_rows": validation_result.invalid_rows_count,
                    "column_mapping": mapping.model_dump()
                },
                created_at=now
            )
            self.db.add(dataset)
            self.db.flush() # Populate dataset.id

            # 2. Create DataImportJob record
            serialized_errors = [e.model_dump() for e in errors[:200]]
            job = DataImportJob(
                dataset_id=dataset.id,
                workspace_id=workspace_id,
                status="completed" if valid_records else "failed",
                total_rows=validation_result.total_rows_inspected,
                accepted_rows=len(valid_records),
                rejected_rows=validation_result.invalid_rows_count,
                error_log=serialized_errors,
                started_at=now,
                completed_at=datetime.now(timezone.utc)
            )
            self.db.add(job)
            self.db.flush()

            # 3. Bulk insert valid customer records
            customer_objs = []
            for r in valid_records:
                r["dataset_id"] = dataset.id
                customer_objs.append(Customer(**r))
            
            if customer_objs:
                self.db.bulk_save_objects(customer_objs)
                
            # 4. Audit Event
            audit = AuditEvent(
                workspace_id=workspace_id,
                user_id=user_id,
                event_type="dataset_imported",
                entity_type="dataset",
                entity_id=dataset.id,
                details={
                    "dataset_name": dataset_name,
                    "filename": filename,
                    "accepted_rows": len(valid_records),
                    "rejected_rows": validation_result.invalid_rows_count
                },
                timestamp=now
            )
            self.db.add(audit)
            
            self.db.commit()
            self.db.refresh(dataset)
            self.db.refresh(job)

            # Generate data quality report
            quality_report = self.generate_quality_report(dataset.id)
            return dataset, job, quality_report

        except Exception as e:
            self.db.rollback()
            logger.error(f"Import transaction failed: {e}")
            raise

    def generate_quality_report(self, dataset_id: int) -> DataQualityReport:
        """Calculate comprehensive data quality statistics for a dataset."""
        dataset = self.db.scalar(select(Dataset).where(Dataset.id == dataset_id))
        if not dataset:
            raise ValueError(f"Dataset with ID {dataset_id} not found.")

        # Query customers in dataset
        customers = self.db.scalars(select(Customer).where(Customer.dataset_id == dataset_id)).all()
        total_customers = len(customers)

        churn_yes = sum(1 for c in customers if c.observed_churn is True)
        churn_no = sum(1 for c in customers if c.observed_churn is False)
        churn_rate_pct = round((churn_yes / total_customers * 100), 2) if total_customers > 0 else 0.0

        # Import job stats
        latest_job = self.db.scalar(
            select(DataImportJob)
            .where(DataImportJob.dataset_id == dataset_id)
            .order_by(DataImportJob.id.desc())
        )
        accepted = latest_job.accepted_rows if latest_job else total_customers
        rejected = latest_job.rejected_rows if latest_job else 0
        total_rows = latest_job.total_rows if latest_job else total_customers

        # Missing values by column check
        missing_by_col = {
            "internet_service": sum(1 for c in customers if not c.internet_service),
            "contract_type": sum(1 for c in customers if not c.contract_type),
            "payment_method": sum(1 for c in customers if not c.payment_method),
            "engagement_score": sum(1 for c in customers if c.engagement_score is None),
            "gender": sum(1 for c in customers if not c.gender)
        }

        # Target leakage warnings
        leakage_warnings = []
        if total_customers > 0:
            # Check if any field is 100% correlated with churn
            for c_type in ["Month-to-month", "One year", "Two year"]:
                sub = [c for c in customers if c.contract_type == c_type]
                if sub and (all(c.observed_churn for c in sub) or all(not c.observed_churn for c in sub)):
                    leakage_warnings.append(f"Field 'contract_type={c_type}' perfectly separates churn label (potential target leakage).")

        # Data Freshness
        dates = [c.last_activity_date for c in customers if c.last_activity_date]
        if dates:
            max_date = max(dates)
            freshness = f"Latest activity recorded on {max_date.strftime('%Y-%m-%d')}."
        else:
            freshness = "No activity dates detected."

        # Quality score out of 100
        quality_score = 100.0
        if total_rows > 0:
            rejection_penalty = (rejected / total_rows) * 40
            quality_score -= rejection_penalty
        if leakage_warnings:
            quality_score -= (len(leakage_warnings) * 15)
        quality_score = max(10.0, min(100.0, round(quality_score, 1)))

        explanation = (
            f"Dataset '{dataset.name}' imported with {accepted} accepted customer records "
            f"and {rejected} rejected invalid rows. "
            f"Observed historical churn rate is {churn_rate_pct}% ({churn_yes} churned / {total_customers} total). "
            f"Data quality health index is {quality_score}/100."
        )

        return DataQualityReport(
            dataset_id=dataset.id,
            dataset_name=dataset.name,
            total_rows=total_rows,
            accepted_rows=accepted,
            rejected_rows=rejected,
            missing_values_by_column=missing_by_col,
            duplicate_identifiers_count=0, # duplicates were rejected or prevented
            invalid_dates_count=0,
            invalid_numeric_count=0,
            churn_label_distribution={"Churned (Yes)": churn_yes, "Retained (No)": churn_no},
            observed_churn_rate_pct=churn_rate_pct,
            potential_target_leakage_warnings=leakage_warnings,
            data_freshness_status=freshness,
            quality_score=quality_score,
            beginner_explanation=explanation
        )
