from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import certifi
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Set
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import uuid

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

SECRET_KEY = os.environ.get('SECRET_KEY', 'galaxy-ideas-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

# Stop words for keyword extraction
STOP_WORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'shall', 'can', 'need', 'dare', 'ought', 'used', 'i', 'me', 'my', 'myself', 'we',
    'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
    'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who', 'whom', 'this',
    'that', 'these', 'those', 'am', 'being', 'each', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'now', 'here', 'there', 'when', 'where', 'why', 'how',
    'all', 'any', 'both', 'into', 'during', 'before', 'after', 'above', 'below',
    'between', 'under', 'again', 'further', 'then', 'once', 'about', 'get', 'make',
    'like', 'new', 'way', 'want', 'use', 'using', 'idea', 'ideas', 'thing', 'things'
}


class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    name: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str
    user: User


class Position(BaseModel):
    x: float
    y: float


class IdeaCreate(BaseModel):
    title: str
    description: str = ""
    status: str = "spark"
    position: Optional[Position] = None


class IdeaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    position: Optional[Position] = None


class Idea(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    title: str
    description: str
    status: str
    position: Position
    brightness: float
    created_at: datetime
    updated_at: datetime


class RelatedIdea(BaseModel):
    id: str
    title: str
    description: str
    status: str
    user_name: str
    user_id: str
    similarity: float


class ConstellationCreate(BaseModel):
    idea_id_1: str
    idea_id_2: str


class Constellation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    idea_id_1: str
    idea_id_2: str
    created_at: datetime


class GlobalLink(BaseModel):
    id: str
    idea_id: str
    related_idea_id: str
    similarity: float


class PublicProfile(BaseModel):
    user_name: str
    ideas: List[Idea]
    constellations: List[Constellation]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def calculate_brightness(status: str) -> float:
    brightness_map = {
        "spark": 0.3,
        "developing": 0.5,
        "refined": 0.7,
        "completed": 1.0,
        "archived": 0.2
    }
    return brightness_map.get(status, 0.5)


def extract_keywords(text: str) -> Set[str]:
    """Extract meaningful keywords from text."""
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    return {w for w in words if w not in STOP_WORDS}


def compute_similarity(keywords1: Set[str], keywords2: Set[str]) -> float:
    """Compute Jaccard similarity between two keyword sets."""
    if not keywords1 or not keywords2:
        return 0.0
    intersection = keywords1 & keywords2
    union = keywords1 | keywords2
    return len(intersection) / len(union) if union else 0.0


def get_idea_keywords(idea: dict) -> Set[str]:
    """Extract keywords from an idea's title and description."""
    text = f"{idea.get('title', '')} {idea.get('description', '')}"
    return extract_keywords(text)


@api_router.post("/auth/signup", response_model=Token)
async def signup(user_data: UserSignup):
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)

    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password_hash": hashed_password,
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.users.insert_one(user_doc)

    access_token = create_access_token(data={"sub": user_id})

    user = User(
        id=user_id,
        email=user_data.email,
        name=user_data.name,
        created_at=datetime.fromisoformat(user_doc["created_at"])
    )

    return Token(access_token=access_token, token_type="bearer", user=user)


@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": user["id"]})

    user_obj = User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        created_at=datetime.fromisoformat(user["created_at"])
    )

    return Token(access_token=access_token, token_type="bearer", user=user_obj)


@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        created_at=datetime.fromisoformat(current_user["created_at"])
    )


@api_router.post("/ideas", response_model=Idea)
async def create_idea(idea_data: IdeaCreate, current_user: dict = Depends(get_current_user)):
    idea_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    position = idea_data.position if idea_data.position else Position(x=0.5, y=0.5)
    brightness = calculate_brightness(idea_data.status)

    # Extract and store keywords for similarity matching
    keywords = list(extract_keywords(f"{idea_data.title} {idea_data.description}"))

    idea_doc = {
        "id": idea_id,
        "user_id": current_user["id"],
        "title": idea_data.title,
        "description": idea_data.description,
        "status": idea_data.status,
        "position": {"x": position.x, "y": position.y},
        "brightness": brightness,
        "keywords": keywords,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }

    await db.ideas.insert_one(idea_doc)

    return Idea(
        id=idea_id,
        user_id=current_user["id"],
        title=idea_data.title,
        description=idea_data.description,
        status=idea_data.status,
        position=position,
        brightness=brightness,
        created_at=now,
        updated_at=now
    )


@api_router.get("/ideas", response_model=List[Idea])
async def get_ideas(current_user: dict = Depends(get_current_user)):
    ideas = await db.ideas.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)

    return [
        Idea(
            id=idea["id"],
            user_id=idea["user_id"],
            title=idea["title"],
            description=idea["description"],
            status=idea["status"],
            position=Position(**idea["position"]),
            brightness=idea["brightness"],
            created_at=datetime.fromisoformat(idea["created_at"]),
            updated_at=datetime.fromisoformat(idea["updated_at"])
        )
        for idea in ideas
    ]


@api_router.get("/ideas/{idea_id}", response_model=Idea)
async def get_idea(idea_id: str, current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"id": idea_id, "user_id": current_user["id"]}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    return Idea(
        id=idea["id"],
        user_id=idea["user_id"],
        title=idea["title"],
        description=idea["description"],
        status=idea["status"],
        position=Position(**idea["position"]),
        brightness=idea["brightness"],
        created_at=datetime.fromisoformat(idea["created_at"]),
        updated_at=datetime.fromisoformat(idea["updated_at"])
    )


@api_router.put("/ideas/{idea_id}", response_model=Idea)
async def update_idea(idea_id: str, idea_data: IdeaUpdate, current_user: dict = Depends(get_current_user)):
    idea = await db.ideas.find_one({"id": idea_id, "user_id": current_user["id"]}, {"_id": 0})
    if not idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}

    if idea_data.title is not None:
        update_data["title"] = idea_data.title
    if idea_data.description is not None:
        update_data["description"] = idea_data.description
    if idea_data.status is not None:
        update_data["status"] = idea_data.status
        update_data["brightness"] = calculate_brightness(idea_data.status)
    if idea_data.position is not None:
        update_data["position"] = {"x": idea_data.position.x, "y": idea_data.position.y}

    # Update keywords if title or description changed
    if idea_data.title is not None or idea_data.description is not None:
        new_title = idea_data.title if idea_data.title is not None else idea["title"]
        new_desc = idea_data.description if idea_data.description is not None else idea["description"]
        update_data["keywords"] = list(extract_keywords(f"{new_title} {new_desc}"))

    await db.ideas.update_one({"id": idea_id}, {"$set": update_data})

    updated_idea = await db.ideas.find_one({"id": idea_id}, {"_id": 0})

    return Idea(
        id=updated_idea["id"],
        user_id=updated_idea["user_id"],
        title=updated_idea["title"],
        description=updated_idea["description"],
        status=updated_idea["status"],
        position=Position(**updated_idea["position"]),
        brightness=updated_idea["brightness"],
        created_at=datetime.fromisoformat(updated_idea["created_at"]),
        updated_at=datetime.fromisoformat(updated_idea["updated_at"])
    )


@api_router.delete("/ideas/{idea_id}")
async def delete_idea(idea_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.ideas.delete_one({"id": idea_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Idea not found")

    await db.constellations.delete_many({
        "user_id": current_user["id"],
        "$or": [{"idea_id_1": idea_id}, {"idea_id_2": idea_id}]
    })

    return {"message": "Idea deleted successfully"}


@api_router.get("/ideas/{idea_id}/related", response_model=List[RelatedIdea])
async def get_related_ideas(idea_id: str, current_user: dict = Depends(get_current_user)):
    """Find similar ideas from other users using keyword matching."""
    # Get the source idea
    source_idea = await db.ideas.find_one({"id": idea_id, "user_id": current_user["id"]}, {"_id": 0})
    if not source_idea:
        raise HTTPException(status_code=404, detail="Idea not found")

    source_keywords = set(source_idea.get("keywords", []))
    if not source_keywords:
        source_keywords = get_idea_keywords(source_idea)

    # Get all ideas from other users (public ones - completed or refined)
    other_ideas = await db.ideas.find(
        {
            "user_id": {"$ne": current_user["id"]},
            "status": {"$in": ["completed", "refined", "developing"]}
        },
        {"_id": 0}
    ).to_list(500)

    # Compute similarities
    related = []
    for idea in other_ideas:
        idea_keywords = set(idea.get("keywords", []))
        if not idea_keywords:
            idea_keywords = get_idea_keywords(idea)

        similarity = compute_similarity(source_keywords, idea_keywords)
        if similarity > 0.1:  # Minimum threshold
            # Get user name
            user = await db.users.find_one({"id": idea["user_id"]}, {"_id": 0})
            user_name = user["name"] if user else "Unknown"

            related.append(RelatedIdea(
                id=idea["id"],
                title=idea["title"],
                description=idea["description"][:200] if idea["description"] else "",
                status=idea["status"],
                user_name=user_name,
                user_id=idea["user_id"],
                similarity=round(similarity, 2)
            ))

    # Sort by similarity and return top 10
    related.sort(key=lambda x: x.similarity, reverse=True)
    return related[:10]


@api_router.get("/discover", response_model=List[RelatedIdea])
async def discover_ideas(current_user: dict = Depends(get_current_user)):
    """Discover ideas from other users based on all your ideas."""
    # Get user's ideas
    user_ideas = await db.ideas.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)

    if not user_ideas:
        # Return random public ideas if user has no ideas
        public_ideas = await db.ideas.find(
            {"status": {"$in": ["completed", "refined"]}},
            {"_id": 0}
        ).to_list(20)

        results = []
        for idea in public_ideas[:10]:
            user = await db.users.find_one({"id": idea["user_id"]}, {"_id": 0})
            user_name = user["name"] if user else "Unknown"
            results.append(RelatedIdea(
                id=idea["id"],
                title=idea["title"],
                description=idea["description"][:200] if idea["description"] else "",
                status=idea["status"],
                user_name=user_name,
                user_id=idea["user_id"],
                similarity=0.5
            ))
        return results

    # Combine all user keywords
    all_user_keywords: Set[str] = set()
    for idea in user_ideas:
        keywords = set(idea.get("keywords", []))
        if not keywords:
            keywords = get_idea_keywords(idea)
        all_user_keywords.update(keywords)

    # Get ideas from other users
    other_ideas = await db.ideas.find(
        {
            "user_id": {"$ne": current_user["id"]},
            "status": {"$in": ["completed", "refined", "developing"]}
        },
        {"_id": 0}
    ).to_list(500)

    # Compute similarities and dedupe
    related = []
    seen_titles = set()

    for idea in other_ideas:
        if idea["title"].lower() in seen_titles:
            continue
        seen_titles.add(idea["title"].lower())

        idea_keywords = set(idea.get("keywords", []))
        if not idea_keywords:
            idea_keywords = get_idea_keywords(idea)

        similarity = compute_similarity(all_user_keywords, idea_keywords)
        if similarity > 0.05:
            user = await db.users.find_one({"id": idea["user_id"]}, {"_id": 0})
            user_name = user["name"] if user else "Unknown"

            related.append(RelatedIdea(
                id=idea["id"],
                title=idea["title"],
                description=idea["description"][:200] if idea["description"] else "",
                status=idea["status"],
                user_name=user_name,
                user_id=idea["user_id"],
                similarity=round(similarity, 2)
            ))

    related.sort(key=lambda x: x.similarity, reverse=True)
    return related[:20]


@api_router.post("/constellations", response_model=Constellation)
async def create_constellation(constellation_data: ConstellationCreate, current_user: dict = Depends(get_current_user)):
    idea1 = await db.ideas.find_one({"id": constellation_data.idea_id_1, "user_id": current_user["id"]}, {"_id": 0})
    idea2 = await db.ideas.find_one({"id": constellation_data.idea_id_2, "user_id": current_user["id"]}, {"_id": 0})

    if not idea1 or not idea2:
        raise HTTPException(status_code=404, detail="One or both ideas not found")

    existing = await db.constellations.find_one({
        "user_id": current_user["id"],
        "$or": [
            {"idea_id_1": constellation_data.idea_id_1, "idea_id_2": constellation_data.idea_id_2},
            {"idea_id_1": constellation_data.idea_id_2, "idea_id_2": constellation_data.idea_id_1}
        ]
    })

    if existing:
        raise HTTPException(status_code=400, detail="Constellation already exists")

    constellation_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    constellation_doc = {
        "id": constellation_id,
        "user_id": current_user["id"],
        "idea_id_1": constellation_data.idea_id_1,
        "idea_id_2": constellation_data.idea_id_2,
        "created_at": now.isoformat()
    }

    await db.constellations.insert_one(constellation_doc)

    return Constellation(
        id=constellation_id,
        user_id=current_user["id"],
        idea_id_1=constellation_data.idea_id_1,
        idea_id_2=constellation_data.idea_id_2,
        created_at=now
    )


@api_router.get("/constellations", response_model=List[Constellation])
async def get_constellations(current_user: dict = Depends(get_current_user)):
    constellations = await db.constellations.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(1000)

    return [
        Constellation(
            id=c["id"],
            user_id=c["user_id"],
            idea_id_1=c["idea_id_1"],
            idea_id_2=c["idea_id_2"],
            created_at=datetime.fromisoformat(c["created_at"])
        )
        for c in constellations
    ]


@api_router.delete("/constellations/{constellation_id}")
async def delete_constellation(constellation_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.constellations.delete_one({"id": constellation_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Constellation not found")

    return {"message": "Constellation deleted successfully"}


@api_router.get("/public/profile/{user_id}", response_model=PublicProfile)
async def get_public_profile(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    ideas = await db.ideas.find(
        {"user_id": user_id, "status": {"$in": ["completed", "refined"]}},
        {"_id": 0}
    ).to_list(1000)

    constellations = await db.constellations.find({"user_id": user_id}, {"_id": 0}).to_list(1000)

    return PublicProfile(
        user_name=user["name"],
        ideas=[
            Idea(
                id=idea["id"],
                user_id=idea["user_id"],
                title=idea["title"],
                description=idea["description"],
                status=idea["status"],
                position=Position(**idea["position"]),
                brightness=idea["brightness"],
                created_at=datetime.fromisoformat(idea["created_at"]),
                updated_at=datetime.fromisoformat(idea["updated_at"])
            )
            for idea in ideas
        ],
        constellations=[
            Constellation(
                id=c["id"],
                user_id=c["user_id"],
                idea_id_1=c["idea_id_1"],
                idea_id_2=c["idea_id_2"],
                created_at=datetime.fromisoformat(c["created_at"])
            )
            for c in constellations
        ]
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
