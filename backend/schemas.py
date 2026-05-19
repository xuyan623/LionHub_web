from pydantic import BaseModel


class DatabasePayload(BaseModel):
    database: dict
    version: int = 0


class AttachmentDeletePayload(BaseModel):
    paths: list[str]


class RegisterPayload(BaseModel):
    username: str
    name: str
    email: str
    phone: str
    department: str
    password: str
    bio: str = ""
    skillTags: list[str] = []


class PersistenceConflictError(Exception):
    def __init__(self, current_version: int) -> None:
        super().__init__(f"Shared database version conflict: current version is {current_version}.")
        self.current_version = current_version
