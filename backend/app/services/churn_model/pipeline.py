import os
import joblib
import logging
from datetime import datetime, timezone
from typing import Dict, List, Tuple, Any, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.dummy import DummyClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models.entities import Customer, ModelVersion, Prediction, AuditEvent
from app.schemas.model import EvaluationMetrics, ModelVersionResponse

logger = logging.getLogger("retainiq.ml")

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "models_storage"))
os.makedirs(MODELS_DIR, exist_ok=True)

# Explicit feature definitions ensuring no target leakage
NUMERICAL_FEATURES = [
    "tenure_months",
    "monthly_charges",
    "total_charges",
    "engagement_score"
]

CATEGORICAL_FEATURES = [
    "contract_type",
    "internet_service",
    "payment_method",
    "paperless_billing",
    "gender",
    "senior_citizen",
    "partner",
    "dependents",
    "phone_service",
    "multiple_lines",
    "online_security",
    "online_backup",
    "device_protection",
    "tech_support",
    "streaming_tv",
    "streaming_movies"
]

LEAKAGE_COLUMNS = [
    "id",
    "customer_identifier",
    "workspace_id",
    "dataset_id",
    "subscription_status", # Post-event status leakage
    "last_activity_date",
    "created_at",
    "updated_at",
    "observed_churn"
]

class ChurnModelPipeline:
    def __init__(self, db: Session):
        self.db = db

    def load_customer_dataframe(self, workspace_id: int) -> pd.DataFrame:
        """Fetch customer records from MySQL into Pandas DataFrame."""
        customers = self.db.scalars(
            select(Customer).where(Customer.workspace_id == workspace_id)
        ).all()
        
        if not customers or len(customers) < 20:
            raise ValueError(
                f"Insufficient customer records ({len(customers)} found). "
                "At least 20 customer records are required to train a valid predictive model."
            )

        data = []
        for c in customers:
            data.append({
                "id": c.id,
                "customer_identifier": c.customer_identifier,
                "gender": c.gender or "Unknown",
                "senior_citizen": 1 if c.senior_citizen else 0,
                "partner": c.partner or "Unknown",
                "dependents": c.dependents or "Unknown",
                "tenure_months": c.tenure_months,
                "phone_service": c.phone_service or "Unknown",
                "multiple_lines": c.multiple_lines or "Unknown",
                "internet_service": c.internet_service or "No",
                "online_security": c.online_security or "No",
                "online_backup": c.online_backup or "No",
                "device_protection": c.device_protection or "No",
                "tech_support": c.tech_support or "No",
                "streaming_tv": c.streaming_tv or "No",
                "streaming_movies": c.streaming_movies or "No",
                "contract_type": c.contract_type or "Month-to-month",
                "paperless_billing": c.paperless_billing or "No",
                "payment_method": c.payment_method or "Unknown",
                "monthly_charges": c.monthly_charges,
                "total_charges": c.total_charges,
                "engagement_score": c.engagement_score if c.engagement_score is not None else 50.0,
                "observed_churn": 1 if c.observed_churn else 0
            })
        return pd.DataFrame(data)

    def train_model(
        self,
        workspace_id: int,
        algorithm: str = "random_forest",
        test_size: float = 0.2
    ) -> ModelVersion:
        """
        Train a genuine Scikit-learn churn classification model with train/test isolation.
        Saves Joblib artifact to filesystem and records metadata and evaluation metrics in MySQL.
        """
        df = self.load_customer_dataframe(workspace_id)

        # Target class balance check
        churn_counts = df["observed_churn"].value_counts().to_dict()
        if len(churn_counts) < 2:
            raise ValueError(
                "Training dataset must contain both churned and retained customer examples. "
                f"Only one class detected: {churn_counts}"
            )

        # Prepare X and y
        feature_cols = [c for c in NUMERICAL_FEATURES + CATEGORICAL_FEATURES if c in df.columns]
        X = df[feature_cols]
        y = df["observed_churn"]

        # Stratified train/test split to guarantee test evaluation isolation
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )

        num_cols = [c for c in NUMERICAL_FEATURES if c in feature_cols]
        cat_cols = [c for c in CATEGORICAL_FEATURES if c in feature_cols]

        # Pipeline preprocessor (FITTED ONLY ON TRAIN DATA)
        numeric_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
        ])

        preprocessor = ColumnTransformer(transformers=[
            ("num", numeric_transformer, num_cols),
            ("cat", categorical_transformer, cat_cols)
        ])

        # Baseline model: stratified dummy classifier
        baseline = DummyClassifier(strategy="stratified", random_state=42)
        baseline.fit(X_train, y_train)
        y_base_pred = baseline.predict(X_test)
        base_f1 = float(f1_score(y_test, y_base_pred, zero_division=0))

        # Main classifier
        if algorithm.lower() == "logistic_regression":
            clf = LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42)
            alg_name = "Logistic Regression (Balanced)"
        else:
            clf = RandomForestClassifier(
                n_estimators=100,
                max_depth=6,
                min_samples_split=5,
                class_weight="balanced",
                random_state=42
            )
            alg_name = "Random Forest Classifier (Balanced)"

        model_pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        # Fit model on training data only
        model_pipeline.fit(X_train, y_train)

        # Evaluate on test set
        y_pred = model_pipeline.predict(X_test)
        y_proba = model_pipeline.predict_proba(X_test)[:, 1]

        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc = float(roc_auc_score(y_test, y_proba))

        cm = confusion_matrix(y_test, y_pred)
        # [[TN, FP], [FN, TP]]
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

        # Extract feature importances
        feature_names = []
        if hasattr(preprocessor, "get_feature_names_out"):
            raw_names = preprocessor.get_feature_names_out()
            feature_names = [n.replace("num__", "").replace("cat__", "") for n in raw_names]

        importances_dict = {}
        if hasattr(clf, "feature_importances_") and feature_names:
            for name, imp in zip(feature_names, clf.feature_importances_):
                importances_dict[name] = round(float(imp), 4)
            # Sort descending
            importances_dict = dict(sorted(importances_dict.items(), key=lambda item: item[1], reverse=True)[:15])
        elif hasattr(clf, "coef_") and feature_names:
            for name, coef in zip(feature_names, clf.coef_[0]):
                importances_dict[name] = round(float(abs(coef)), 4)
            importances_dict = dict(sorted(importances_dict.items(), key=lambda item: item[1], reverse=True)[:15])

        # Version code
        count = self.db.scalar(select(func.count(ModelVersion.id)).where(ModelVersion.workspace_id == workspace_id)) or 0
        version_code = f"v{count + 1}.0"

        # Persist Joblib artifact to filesystem
        artifact_filename = f"model_{workspace_id}_{version_code}.joblib"
        artifact_path = os.path.join(MODELS_DIR, artifact_filename)
        joblib.dump(model_pipeline, artifact_path)

        eval_metrics = {
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc, 4),
            "baseline_f1": round(base_f1, 4),
            "baseline_churn_rate": round(float(y.mean()), 4),
            "confusion_matrix": {
                "true_negatives": tn,
                "false_positives": fp,
                "false_negatives": fn,
                "true_positives": tp
            },
            "class_distribution": {
                "total_retained": int(churn_counts.get(0, 0)),
                "total_churned": int(churn_counts.get(1, 0))
            },
            "methodology": f"Stratified train/test split ({int((1-test_size)*100)}% train / {int(test_size*100)}% test). Preprocessing fitted on training data only."
        }

        # Save ModelVersion in MySQL
        model_version = ModelVersion(
            workspace_id=workspace_id,
            version_code=version_code,
            algorithm_name=alg_name,
            target_column="observed_churn",
            target_definition="Predicts observed customer churn status based on historical behavior and contractual attributes.",
            training_sample_size=len(X_train),
            test_sample_size=len(X_test),
            features_used=feature_cols,
            evaluation_metrics=eval_metrics,
            feature_importances=importances_dict,
            artifact_path=artifact_path,
            is_active=True,
            created_at=datetime.now(timezone.utc)
        )
        self.db.add(model_version)
        self.db.commit()
        self.db.refresh(model_version)

        # Generate batch predictions for all customers in workspace
        self.generate_predictions_for_workspace(workspace_id, model_version.id)

        return model_version

    def generate_predictions_for_workspace(
        self,
        workspace_id: int,
        model_version_id: int
    ) -> int:
        """
        Generate predictions using persisted Joblib model artifact and store in MySQL.
        Assigns transparent risk tiers: High (>=0.60), Medium (0.35-0.60), Low (<0.35).
        """
        model_version = self.db.scalar(select(ModelVersion).where(ModelVersion.id == model_version_id))
        if not model_version or not model_version.artifact_path or not os.path.exists(model_version.artifact_path):
            raise FileNotFoundError(f"Model artifact for version {model_version_id} not found.")

        pipeline = joblib.load(model_version.artifact_path)
        df = self.load_customer_dataframe(workspace_id)

        feature_cols = model_version.features_used
        X = df[feature_cols]

        probabilities = pipeline.predict_proba(X)[:, 1]
        labels = pipeline.predict(X)

        # Clear older predictions for this model if any exist
        self.db.query(Prediction).filter(
            Prediction.workspace_id == workspace_id,
            Prediction.model_version_id == model_version_id
        ).delete()
        self.db.commit()

        predictions = []
        now = datetime.now(timezone.utc)
        top_importances = list(model_version.feature_importances.keys())[:3] if model_version.feature_importances else []

        for idx, row in df.iterrows():
            prob = float(probabilities[idx])
            label = bool(labels[idx])

            if prob >= 0.60:
                tier = "High"
            elif prob >= 0.35:
                tier = "Medium"
            else:
                tier = "Low"

            # Customer-specific contributing factors
            contributing = []
            if row["contract_type"] == "Month-to-month":
                contributing.append({"factor": "Month-to-month Contract", "impact": "High Risk Driver"})
            if row["tenure_months"] <= 12:
                contributing.append({"factor": f"Low Tenure ({row['tenure_months']} mos)", "impact": "Early Lifecycle Risk"})
            if row["monthly_charges"] > 80.0:
                contributing.append({"factor": f"Elevated Monthly Spend (${row['monthly_charges']})", "impact": "Price Sensitivity Risk"})
            if not contributing:
                contributing.append({"factor": "Stable Account Profile", "impact": "Retention Stabilizer"})

            pred = Prediction(
                customer_id=int(row["id"]),
                model_version_id=model_version.id,
                workspace_id=workspace_id,
                predicted_churn_probability=round(prob, 4),
                predicted_churn_label=label,
                risk_tier=tier,
                top_contributing_factors=contributing,
                prediction_timestamp=now
            )
            predictions.append(pred)

        self.db.bulk_save_objects(predictions)
        self.db.commit()
        return len(predictions)
