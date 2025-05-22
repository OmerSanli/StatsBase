
from pydantic import BaseModel
from typing import List, Optional


class UserMetrics(BaseModel):
    username: str
    profile_pic_url: Optional[str]
    follower_count: int
    average_likes: float
    average_comments: float
    reel_count: Optional[int] = 0
    engagement_rate: float
    collaboration_count: Optional[int] = 0
    last_collaborations: Optional[List[str]] = []
