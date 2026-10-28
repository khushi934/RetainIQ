import csv
import random
import os
from datetime import datetime, timedelta

random.seed(42)

OUT_DIR = os.path.dirname(os.path.abspath(__file__))
os.makedirs(OUT_DIR, exist_ok=True)

CLEAN_CSV = os.path.join(OUT_DIR, "telco_customer_churn.csv")
ERRORS_CSV = os.path.join(OUT_DIR, "telco_sample_with_errors.csv")

contract_types = ["Month-to-month", "One year", "Two year"]
internet_services = ["DSL", "Fiber optic", "No"]
payment_methods = [
    "Electronic check",
    "Mailed check",
    "Bank transfer (automatic)",
    "Credit card (automatic)"
]
yes_no = ["Yes", "No"]
yes_no_no_internet = ["Yes", "No", "No internet service"]
yes_no_no_phone = ["Yes", "No", "No phone service"]

def generate_customer(cid: int, inject_error: str | None = None):
    tenure = random.randint(1, 72)
    contract = random.choices(contract_types, weights=[0.55, 0.25, 0.20])[0]
    internet = random.choices(internet_services, weights=[0.35, 0.45, 0.20])[0]
    
    # Base monthly charge depends on internet
    if internet == "Fiber optic":
        monthly = round(random.uniform(70.0, 115.0), 2)
    elif internet == "DSL":
        monthly = round(random.uniform(39.0, 75.0), 2)
    else:
        monthly = round(random.uniform(18.5, 25.5), 2)
    
    total = round(monthly * tenure * random.uniform(0.95, 1.05), 2)
    
    # Churn probability higher for month-to-month, fiber optic, electronic check, low tenure
    churn_score = 0.1
    if contract == "Month-to-month":
        churn_score += 0.35
    elif contract == "One year":
        churn_score += 0.08
    else:
        churn_score += 0.02
        
    if internet == "Fiber optic":
        churn_score += 0.20
    if tenure < 12:
        churn_score += 0.20
    elif tenure > 48:
        churn_score -= 0.15
        
    payment = random.choice(payment_methods)
    if payment == "Electronic check":
        churn_score += 0.10
        
    churn_prob = max(0.02, min(0.95, churn_score))
    churned = random.random() < churn_prob
    churn_label = "Yes" if churned else "No"
    
    # Subscription status
    status = "Churned" if churned else "Active"
    
    # Activity date within last 90 days
    days_ago = random.randint(1, 90) if not churned else random.randint(30, 180)
    activity_date = (datetime(2026, 10, 25) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
    
    gender = random.choice(["Male", "Female"])
    senior = 1 if random.random() < 0.16 else 0
    partner = random.choice(yes_no)
    dependents = random.choice(yes_no)
    phone = "Yes" if random.random() < 0.90 else "No"
    lines = "No" if phone == "No" else random.choice(["Yes", "No"])
    
    security = "No internet service" if internet == "No" else random.choice(["Yes", "No"])
    backup = "No internet service" if internet == "No" else random.choice(["Yes", "No"])
    protection = "No internet service" if internet == "No" else random.choice(["Yes", "No"])
    tech = "No internet service" if internet == "No" else random.choice(["Yes", "No"])
    stream_tv = "No internet service" if internet == "No" else random.choice(["Yes", "No"])
    stream_movies = "No internet service" if internet == "No" else random.choice(["Yes", "No"])
    paperless = random.choice(yes_no)
    
    engagement = round(max(5.0, min(99.0, 100 - (churn_prob * 80) + random.uniform(-10, 10))), 1)
    
    cust_id = f"CUST-{cid:05d}"
    
    if inject_error == "missing_id":
        cust_id = ""
    elif inject_error == "invalid_numeric":
        monthly = "INVALID_NUMBER"
    elif inject_error == "negative_tenure":
        tenure = -12
    elif inject_error == "invalid_date":
        activity_date = "99-99-2026"
    elif inject_error == "duplicate_id":
        cust_id = "CUST-00001"
        
    return {
        "customerID": cust_id,
        "gender": gender,
        "SeniorCitizen": senior,
        "Partner": partner,
        "Dependents": dependents,
        "tenure": tenure,
        "PhoneService": phone,
        "MultipleLines": lines,
        "InternetService": internet,
        "OnlineSecurity": security,
        "OnlineBackup": backup,
        "DeviceProtection": protection,
        "TechSupport": tech,
        "StreamingTV": stream_tv,
        "StreamingMovies": stream_movies,
        "Contract": contract,
        "PaperlessBilling": paperless,
        "PaymentMethod": payment,
        "MonthlyCharges": monthly,
        "TotalCharges": total,
        "SubscriptionStatus": status,
        "LastActivityDate": activity_date,
        "EngagementScore": engagement,
        "Churn": churn_label
    }

headers = [
    "customerID", "gender", "SeniorCitizen", "Partner", "Dependents",
    "tenure", "PhoneService", "MultipleLines", "InternetService",
    "OnlineSecurity", "OnlineBackup", "DeviceProtection", "TechSupport",
    "StreamingTV", "StreamingMovies", "Contract", "PaperlessBilling",
    "PaymentMethod", "MonthlyCharges", "TotalCharges", "SubscriptionStatus",
    "LastActivityDate", "EngagementScore", "Churn"
]

# 1. Generate clean dataset (1,000 rows)
with open(CLEAN_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    for i in range(1, 1001):
        writer.writerow(generate_customer(i))

print(f"Generated clean dataset: {CLEAN_CSV} with 1,000 records.")

# 2. Generate sample with known errors for validation testing
with open(ERRORS_CSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=headers)
    writer.writeheader()
    # 50 normal rows
    for i in range(1, 51):
        writer.writerow(generate_customer(i))
    # Injected errors
    writer.writerow(generate_customer(51, inject_error="missing_id"))
    writer.writerow(generate_customer(52, inject_error="invalid_numeric"))
    writer.writerow(generate_customer(53, inject_error="negative_tenure"))
    writer.writerow(generate_customer(54, inject_error="invalid_date"))
    writer.writerow(generate_customer(55, inject_error="duplicate_id"))

print(f"Generated sample with validation errors: {ERRORS_CSV}.")
