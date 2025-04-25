# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel
from datetime import datetime, timedelta
import motor.motor_asyncio
import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MongoDB Configuration
MONGODB_URL = os.getenv("DATABASE_URL", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URL)
db = client.spearpoint

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "development_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Initialize FastAPI
app = FastAPI(title="SpearPoint API", version="0.1.0")

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
    email: str
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
    email: str
    role: str
    company: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    company: Optional[str] = None

class CloudResource(BaseModel):
    id: str
    name: Optional[str] = None
    type: str
    platform: str
    region: Optional[str] = None
    tags: Optional[Dict[str, str]] = None

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

class CostRecommendation(BaseModel):
    id: Optional[str] = None
    resource_id: str
    resource_type: str
    current_configuration: str
    recommended_configuration: str
    estimated_savings: float
    impact: str
    status: str = "open"

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(email: str):
    user = await db.users.find_one({"email": email})
    if user:
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
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
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

# Resources routes
@app.get("/api/resources", response_model=dict)
async def get_resources(current_user: User = Depends(get_current_active_user)):
    resources = []
    cursor = db.resources.find({"user_id": str(current_user.id)})
    async for document in cursor:
        resources.append(CloudResource(**document))
    
    return {
        "status": "success",
        "results": len(resources),
        "data": resources
    }

# Security routes
@app.get("/api/security/issues", response_model=dict)
async def get_security_issues(current_user: User = Depends(get_current_active_user)):
    issues = []
    cursor = db.security_issues.find({"user_id": str(current_user.id)})
    async for document in cursor:
        issues.append(SecurityIssue(**document))
    
    return {
        "status": "success",
        "results": len(issues),
        "data": issues
    }

@app.post("/api/security/issues/{issue_id}/remediate", response_model=dict)
async def remediate_security_issue(
    issue_id: str,
    current_user: User = Depends(get_current_active_user)
):
    result = await db.security_issues.update_one(
        {"_id": issue_id, "user_id": str(current_user.id)},
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

# Cost routes
@app.get("/api/costs/recommendations", response_model=dict)
async def get_cost_recommendations(current_user: User = Depends(get_current_active_user)):
    recommendations = []
    cursor = db.cost_recommendations.find({"user_id": str(current_user.id)})
    async for document in cursor:
        recommendations.append(CostRecommendation(**document))
    
    return {
        "status": "success",
        "results": len(recommendations),
        "data": recommendations
    }

@app.post("/api/costs/recommendations/{recommendation_id}/apply", response_model=dict)
async def apply_cost_recommendation(
    recommendation_id: str,
    current_user: User = Depends(get_current_active_user)
):
    result = await db.cost_recommendations.update_one(
        {"_id": recommendation_id, "user_id": str(current_user.id)},
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

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "0.1.0",
        "environment": os.getenv("NODE_ENV", "development")
    }

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", "3001")), reload=True)