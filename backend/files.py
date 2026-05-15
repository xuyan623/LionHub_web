import re
from contextlib import suppress
from pathlib import Path

from fastapi import HTTPException

from .config import UPLOADS_DIR


SAFE_FILENAME_PATTERN = re.compile(r'[<>:"/\\|?*\x00-\x1f]+')


def sanitize_filename(filename: str) -> str:
    candidate = Path(filename.strip())
    original_extension = candidate.suffix.lower()
    extension = original_extension if re.fullmatch(r"\.[A-Za-z0-9]{1,16}", original_extension) else ""
    normalized_stem = SAFE_FILENAME_PATTERN.sub("-", candidate.stem)
    cleaned_stem = normalized_stem.strip("._-") or "attachment"
    return f"{cleaned_stem}{extension}"


def sanitize_directory_name(directory_name: str) -> str:
    return sanitize_filename(directory_name)


def sanitize_relative_storage_path(relative_path: str) -> str:
    candidate = Path(relative_path)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise HTTPException(status_code=400, detail="非法附件路径。")
    normalized_parts = [sanitize_filename(part) for part in candidate.parts if part not in ("", ".")]
    if not normalized_parts:
        raise HTTPException(status_code=400, detail="非法附件路径。")
    return Path(*normalized_parts).as_posix()


def prune_empty_parent_directories(directory: Path) -> None:
    uploads_root = UPLOADS_DIR.resolve()
    current_directory = directory.resolve()

    while current_directory != uploads_root:
        try:
            next(current_directory.iterdir())
            break
        except StopIteration:
            with suppress(OSError):
                current_directory.rmdir()
            current_directory = current_directory.parent
        except OSError:
            break
