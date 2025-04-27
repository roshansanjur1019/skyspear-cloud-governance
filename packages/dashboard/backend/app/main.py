# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any, Union, Annotated
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import motor.motor_asyncio
import jwt
from passlib.context import CryptContext
import os
import ssl
import uuid
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB/DocumentDB Configuration
MONGODB_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")

# Configure SSL for DocumentDB if needed
if "docdb" in MONGODB_URL or os.getenv("USE_SSL", "false").lower() == "true":
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    client = motor.motor_asyncio.AsyncIOMotorClient(
        MONGODB_URL,
        tls=True,
        tlsAllowInvalidCertificates=True,
        retryWrites=False,  # DocumentDB doesn't support retryWrites
        serverSelectionTimeoutMS=5000
    )
else:
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)

db = client.spearpoint

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "development_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize FastAPI
app = FastAPI(
    title="SpearPoint API",
    description="SpearPoint Cloud Governance Platform API",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGIN", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    password: Optional[str] = None
    role: str = "user"
    company: Optional[str] = None
    last_login: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserInDB(User):
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    company: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: Optional[str] = None

class CloudResource(BaseModel):
    id: str
    name: Optional[str] = None
    type: str
    platform: str
    region: Optional[str] = None
    zone: Optional[str] = None
    tags: Optional[Dict[str, str]] = None
    created_at: Optional[datetime] = None
    resource_group: Optional[str] = None

class SecurityIssue(BaseModel):
    id: Optional[str] = None
    resource_id: str
    resource_type: str
    platform: str
    severity: str
    issue: str
    remediation: str
    compliance: Optional[List[str]] = None
    status: str = "open"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CostRecommendation(BaseModel):
    id: Optional[str] = None
    resource_id: str
    resource_type: str
    current_configuration: str
    recommended_configuration: str
    estimated_savings: float
    estimated_savings_percentage: Optional[float] = None
    currency: Optional[str] = "USD"
    impact: str
    justification: Optional[str] = None
    status: str = "open"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class CloudCredentials(BaseModel):
    aws: Optional[Dict[str, str]] = None
    azure: Optional[Dict[str, str]] = None
    gcp: Optional[Dict[str, str]] = None

# Database startup and shutdown events
@app.on_event("startup")
async def startup_db_client():
    try:
        # Verify MongoDB connection
        await db.command("ping")
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Could not connect to MongoDB: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    print("MongoDB connection closed")

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    print(f"Request {request_id} [{request.method}] {request.url.path} completed in {process_time:.4f}s")
    
    return response

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"status": "error", "message": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    print(f"Unhandled error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal server error"},
    )

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(email: str):
    user = await db.users.find_one({"email": email})
    if user:
        user["id"] = str(user.pop("_id"))
        return UserInDB(**user)
    return None

async def authenticate_user(email: str, password: str):
    user = await get_user(email)
    if not user:
        return False
    if not verify_password(password, user.password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    # Find user by ID
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    
    # Convert _id to id
    user["id"] = str(user.pop("_id"))
    return User(**user)

# Authentication dependency
async def get_current_active_user(token: str = Depends(lambda x: x.headers.get("Authorization").split(" ")[1] if x.headers.get("Authorization") else None)):
    return await get_current_user(token)

# Auth routes
@app.post("/api/auth/login", response_model=dict)
async def login(login_data: LoginRequest):
    user = await authenticate_user(login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    await db.users.update_one(
        {"email": user.email},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create token
    access_token = create_access_token(
        data={"sub": str(user.id)}
    )
    
    # Return user without password
    user_dict = user.dict()
    del user_dict["password"]
    
    return {
        "status": "success",
        "token": access_token,
        "user": user_dict
    }

@app.post("/api/auth/register", response_model=dict)
async def register(register_data: RegisterRequest):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": register_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    user_data = register_data.dict()
    user_data["password"] = get_password_hash(user_data["password"])
    user_data["created_at"] = datetime.utcnow()
    user_data["updated_at"] = datetime.utcnow()
    
    # Insert into database
    result = await db.users.insert_one(user_data)
    user_data["id"] = str(result.inserted_id)
    
    # Create token
    access_token = create_access_token(
        data={"sub": str(result.inserted_id)}
    )
    
    # Return user without password
    del user_data["password"]
    
    return {
        "status": "success",
        "token": access_token,
        "user": user_data
    }

@app.get("/api/auth/profile", response_model=dict)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    return {
        "status": "success",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "company": current_user.company
        }
    }

@app.post("/api/auth/logout", response_model=dict)
async def logout():
    # JWT tokens are stateless, so we don't need to invalidate them
    # In a production environment, you might want to blacklist the token
    return {"status": "success", "message": "Logged out successfully"}

# Cloud provider connections
@app.post("/api/connect/provider", response_model=dict)
async def connect_provider(
    credentials: CloudCredentials,
    current_user: User = Depends(get_current_active_user)
):
    # This would typically connect to the cloud providers and validate credentials
    # For now, we'll just store them (in a real app, encrypt these!)
    
    user_id = current_user.id
    
    # Store credentials (these should be encrypted in a real application)
    await db.cloud_credentials.update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "aws": credentials.aws,
            "azure": credentials.azure,
            "gcp": credentials.gcp,
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    connected_providers = []
    if credentials.aws:
        connected_providers.append("AWS")
    if credentials.azure:
        connected_providers.append("Azure")
    if credentials.gcp:
        connected_providers.append("GCP")
    
    return {
        "status": "success",
        "message": f"Connected to {', '.join(connected_providers)}",
        "providers": connected_providers
    }

# Resources routes
@app.get("/api/resources", response_model=dict)
async def get_resources(
    platform: Optional[str] = None,
    region: Optional[str] = None,
    type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    # Build query
    query = {"user_id": current_user.id}
    if platform:
        query["platform"] = platform
    if region:
        query["region"] = region
    if type:
        query["type"] = type
    
    resources = []
    cursor = db.resources.find(query)
    async for document in cursor:
        document["id"] = str(document.pop("_id"))
        resources.append(CloudResource(**document))
    
    return {
        "status": "success",
        "results": len(resources),
        "data": resources
    }

@app.post("/api/resources/scan", response_model=dict)
async def scan_resources(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    # In a real application, this would trigger a scan of cloud resources
    scan_id = str(uuid.uuid4())
    
    # Add background task to scan resources
    background_tasks.add_task(scan_cloud_resources, current_user.id, scan_id)
    
    return {
        "status": "success",
        "message": "Resource scan started",
        "scan_id": scan_id
    }

# Background task to scan resources
async def scan_cloud_resources(user_id: str, scan_id: str):
    # This would be a long-running task to scan cloud providers
    # For demonstration, we'll just create some sample resources
    
    # Get user's cloud credentials
    credentials = await db.cloud_credentials.find_one({"user_id": user_id})
    
    if not credentials:
        print(f"No cloud credentials found for user {user_id}")
        return
    
    # Sample resources for demo purposes
    sample_resources = []
    
    # AWS resources
    if credentials.get("aws"):
        sample_resources.append({
            "user_id": user_id,
            "id": f"i-{uuid.uuid4().hex[:8]}",
            "name": "example-ec2-instance",
            "type": "t3.micro",
            "platform": "aws",
            "region": "us-east-1",
            "tags": {"Environment": "development", "Owner": "spearpoint"},
            "created_at": datetime.utcnow()
        })
    
    # Azure resources
    if credentials.get("azure"):
        sample_resources.append({
            "user_id": user_id,
            "id": f"/subscriptions/example/resourceGroups/example-rg/providers/Microsoft.Compute/virtualMachines/{uuid.uuid4().hex[:8]}",
            "name": "example-azure-vm",
            "type": "Standard_B2s",
            "platform": "azure",
            "region": "eastus",
            "resource_group": "example-rg",
            "tags": {"environment": "development", "owner": "spearpoint"},
            "created_at": datetime.utcnow()
        })
    
    # GCP resources
    if credentials.get("gcp"):
        sample_resources.append({
            "user_id": user_id,
            "id": f"projects/example/zones/us-central1-a/instances/{uuid.uuid4().hex[:8]}",
            "name": "example-gcp-instance",
            "type": "e2-medium",
            "platform": "gcp",
            "zone": "us-central1-a",
            "tags": {"environment": "development", "owner": "spearpoint"},
            "created_at": datetime.utcnow()
        })
    
    # Insert resources into database
    if sample_resources:
        await db.resources.insert_many(sample_resources)
        print(f"Added {len(sample_resources)} sample resources for user {user_id}")
    
    # Create a scan record
    await db.scans.insert_one({
        "scan_id": scan_id,
        "user_id": user_id,
        "status": "completed",
        "resource_count": len(sample_resources),
        "start_time": datetime.utcnow() - timedelta(seconds=5),
        "end_time": datetime.utcnow(),
        "duration_ms": 5000
    })

# Security routes
@app.get("/api/security/issues", response_model=dict)
async def get_security_issues(
    severity: Optional[str] = None,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    # Build query
    query = {"user_id": current_user.id}
    if severity:
        query["severity"] = severity
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    
    issues = []
    cursor = db.security_issues.find(query)
    async for document in cursor:
        document["id"] = str(document.pop("_id"))
        issues.append(SecurityIssue(**document))
    
    return {
        "status": "success",
        "results": len(issues),
        "data": issues
    }

@app.post("/api/security/scan", response_model=dict)
async def scan_security(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    scan_id = str(uuid.uuid4())
    
    # Add background task to scan for security issues
    background_tasks.add_task(scan_security_issues, current_user.id, scan_id)
    
    return {
        "status": "success",
        "message": "Security scan started",
        "scan_id": scan_id
    }

@app.post("/api/security/issues/{issue_id}/remediate", response_model=dict)
async def remediate_security_issue(
    issue_id: str,
    current_user: User = Depends(get_current_active_user)
):
    result = await db.security_issues.update_one(
        {"_id": issue_id, "user_id": current_user.id},
        {"$set": {"status": "remediated", "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Security issue not found",
        )
    
    return {
        "status": "success",
        "message": "Security issue remediated successfully"
    }

async def scan_security_issues(user_id: str, scan_id: str):
    # This would be a long-running task to scan for security issues
    # For demonstration, we'll just create some sample issues
    
    # Get resources for this user
    resources = []
    cursor = db.resources.find({"user_id": user_id})
    async for document in cursor:
        resources.append(document)
    
    # Sample security issues
    sample_issues = []
    
    for resource in resources:
        # AWS security issues
        if resource["platform"] == "aws":
            if resource["type"] == "t3.micro":
                sample_issues.append({
                    "user_id": user_id,
                    "resource_id": resource["id"],
                    "resource_type": "EC2 Instance",
                    "platform": "aws",
                    "severity": "high",
                    "issue": "Security group allows SSH from any IP",
                    "remediation": "Restrict SSH access to specific IP ranges",
                    "compliance": ["CIS AWS 4.1", "NIST 800-53"],
                    "status": "open",
                    "created_at": datetime.utcnow()
                })
        
        # Azure security issues
        if resource["platform"] == "azure":
            sample_issues.append({
                "user_id": user_id,
                "resource_id": resource["id"],
                "resource_type": "Azure VM",
                "platform": "azure",
                "severity": "medium",
                "issue": "Disk encryption not enabled",
                "remediation": "Enable Azure Disk Encryption for the VM",
                "compliance": ["CIS Azure 7.2", "NIST 800-53"],
                "status": "open",
                "created_at": datetime.utcnow()
            })
        
        # GCP security issues
        if resource["platform"] == "gcp":
            sample_issues.append({
                "user_id": user_id,
                "resource_id": resource["id"],
                "resource_type": "GCP VM Instance",
                "platform": "gcp",
                "severity": "medium",
                "issue": "Instance has public IP without firewall protection",
                "remediation": "Configure firewall rules to restrict access",
                "compliance": ["CIS GCP 4.3", "NIST 800-53"],
                "status": "open",
                "created_at": datetime.utcnow()
            })
    
    # Insert security issues into database
    if sample_issues:
        await db.security_issues.insert_many(sample_issues)
        print(f"Added {len(sample_issues)} sample security issues for user {user_id}")

# Cost routes
@app.get("/api/costs/recommendations", response_model=dict)
async def get_cost_recommendations(
    impact: Optional[str] = None,
    platform: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_active_user)
):
    # Build query
    query = {"user_id": current_user.id}
    if impact:
        query["impact"] = impact
    if platform:
        query["platform"] = platform
    if status:
        query["status"] = status
    
    recommendations = []
    cursor = db.cost_recommendations.find(query)
    async for document in cursor:
        document["id"] = str(document.pop("_id"))
        recommendations.append(CostRecommendation(**document))
    
    return {
        "status": "success",
        "results": len(recommendations),
        "data": recommendations
    }

@app.post("/api/costs/scan", response_model=dict)
async def scan_costs(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_active_user)
):
    scan_id = str(uuid.uuid4())
    
    # Add background task to scan for cost optimizations
    background_tasks.add_task(scan_cost_optimizations, current_user.id, scan_id)
    
    return {
        "status": "success",
        "message": "Cost optimization scan started",
        "scan_id": scan_id
    }

@app.post("/api/costs/recommendations/{recommendation_id}/apply", response_model=dict)
async def apply_cost_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    result = await db.cost_recommendations.update_one(
        {"_id": recommendation_id, "user_id": current_user.id},
        {"$set": {"status": "applied", "updated_at": datetime.utcnow()}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cost recommendation not found",
        )
    
    return {
        "status": "success",
        "message": "Recommendation applied successfully"
    }

async def scan_cost_optimizations(user_id: str, scan_id: str):
    # This would be a long-running task to scan for cost optimizations
    # For demonstration, we'll just create some sample recommendations
    
    # Get resources for this user
    resources = []
    cursor = db.resources.find({"user_id": user_id})
    async for document in cursor:
        resources.append(document)
    
    # Sample cost recommendations
    sample_recommendations = []
    
    for resource in resources:
        # AWS cost recommendations
        if resource["platform"] == "aws" and resource["type"] == "t3.micro":
            sample_recommendations.append({
                "user_id": user_id,
                "resource_id": resource["id"],
                "resource_type": "EC2 Instance",
                "platform": "aws",
                "current_configuration": "t3.micro, On-Demand",
                "recommended_configuration": "t3.micro, Reserved Instance, 1 year",
                "estimated_savings": 120.45,
                "estimated_savings_percentage": 40,
                "impact": "medium",
                "justification": "Instance has been running constantly for 30+ days. Reserved Instance would reduce cost.",
                "status": "open",
                "created_at": datetime.utcnow()
            })
        
        # Azure cost recommendations
        if resource["platform"] == "azure" and resource["type"] == "Standard_B2s":
            sample_recommendations.append({
                "user_id": user_id,
                "resource_id": resource["id"],
                "resource_type": "Azure VM",
                "platform": "azure",
                "current_configuration": "Standard_B2s, Pay-As-You-Go",
                "recommended_configuration": "Standard_B1s, Pay-As-You-Go",
                "estimated_savings": 67.80,
                "estimated_savings_percentage": 35,
                "impact": "medium",
                "justification": "VM is consistently underutilized. Downsizing would maintain performance while reducing cost.",
                "status": "open",
                "created_at": datetime.utcnow()
            })
        
        # GCP cost recommendations
        if resource["platform"] == "gcp" and resource["type"] == "e2-medium":
            sample_recommendations.append({
                "user_id": user_id,
                "resource_id": resource["id"],
                "resource_type": "GCP VM Instance",
                "platform": "gcp",
                "current_configuration": "e2-medium, On-Demand",
                "recommended_configuration": "e2-small, Committed Use, 1 year",
                "estimated_savings": 91.25,
                "estimated_savings_percentage": 45,
                "impact": "high",
                "justification": "Instance has low CPU utilization. Downsizing and using committed use would reduce cost significantly.",
                "status": "open",
                "created_at": datetime.utcnow()
            })
    
    # Insert cost recommendations into database
    if sample_recommendations:
        await db.cost_recommendations.insert_many(sample_recommendations)
        print(f"Added {len(sample_recommendations)} sample cost recommendations for user {user_id}")

# Dashboard summary
@app.get("/api/dashboard/summary", response_model=dict)
async def get_dashboard_summary(current_user: User = Depends(get_current_active_user)):
    user_id = current_user.id
    
    # Get resource counts
    resource_count = await db.resources.count_documents({"user_id": user_id})
    
    # Get security issues by severity
    security_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$severity",
            "count": {"$sum": 1}
        }}
    ]
    security_cursor = db.security_issues.aggregate(security_pipeline)
    security_by_severity = {}
    async for doc in security_cursor:
        security_by_severity[doc["_id"]] = doc["count"]
    
    # Get cost savings
    cost_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": None,
            "total_savings": {"$sum": "$estimated_savings"}
        }}
    ]
    cost_cursor = db.cost_recommendations.aggregate(cost_pipeline)
    total_savings = 0
    async for doc in cost_cursor:
        total_savings = doc["total_savings"]
    
    # Get resource counts by platform
    platform_pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {
            "_id": "$platform",
            "count": {"$sum": 1}
        }}
    ]
    platform_cursor = db.resources.aggregate(platform_pipeline)
    resources_by_platform = {}
    async for doc in platform_cursor:
        resources_by_platform[doc["_id"]] = doc["count"]
    
    return {
        "status": "success",
        "data": {
            "resources": {
                "total": resource_count,
                "by_platform": resources_by_platform
            },
            "security": {
                "total": sum(security_by_severity.values()),
                "by_severity": security_by_severity
            },
            "costs": {
                "estimated_savings": total_savings,
                "recommendations": await db.cost_recommendations.count_documents({"user_id": user_id})
            },
            "latest_scan": await db.scans.find_one(
                {"user_id": user_id},
                sort=[("end_time", -1)]
            )
        }
    }

# Health check
@app.get("/health")
async def health_check():
    # Check MongoDB connection
    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": os.getenv("NODE_ENV", "development"),
        "database": db_status
    }

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "3001")), reload=True)