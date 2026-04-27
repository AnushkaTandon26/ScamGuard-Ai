"""
Small async-friendly JSON-backed database fallback used when MongoDB is unavailable.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from bson import ObjectId


DATA_FILE = Path(__file__).resolve().parent / "local_data.json"


def _to_jsonable(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return {"$oid": str(value)}
    if isinstance(value, datetime):
        return {"$date": value.isoformat()}
    if isinstance(value, list):
        return [_to_jsonable(item) for item in value]
    if isinstance(value, dict):
        return {key: _to_jsonable(item) for key, item in value.items()}
    return value


def _from_jsonable(value: Any) -> Any:
    if isinstance(value, dict):
        if "$oid" in value:
            return ObjectId(value["$oid"])
        if "$date" in value:
            return datetime.fromisoformat(value["$date"])
        return {key: _from_jsonable(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_from_jsonable(item) for item in value]
    return value


def _matches(document: dict[str, Any], query: dict[str, Any]) -> bool:
    for key, expected in query.items():
        actual = document.get(key)
        if isinstance(expected, dict):
            for op, value in expected.items():
                if op == "$gte" and not (actual >= value):
                    return False
                if op == "$lt" and not (actual < value):
                    return False
                if op == "$lte" and not (actual <= value):
                    return False
                if op == "$gt" and not (actual > value):
                    return False
        elif actual != expected:
            return False
    return True


@dataclass
class InsertOneResult:
    inserted_id: ObjectId


@dataclass
class UpdateResult:
    modified_count: int


@dataclass
class DeleteResult:
    deleted_count: int


class LocalCursor:
    def __init__(self, documents: list[dict[str, Any]]):
        self._documents = documents
        self._index = 0

    def sort(self, key: str, direction: int):
        reverse = direction < 0
        self._documents.sort(key=lambda item: item.get(key), reverse=reverse)
        return self

    def skip(self, count: int):
        self._documents = self._documents[count:]
        return self

    def limit(self, count: int):
        self._documents = self._documents[:count]
        return self

    def __aiter__(self):
        self._index = 0
        return self

    async def __anext__(self):
        if self._index >= len(self._documents):
            raise StopAsyncIteration
        item = self._documents[self._index]
        self._index += 1
        return dict(item)


class LocalCollection:
    def __init__(self, database: "LocalDatabase", name: str):
        self._database = database
        self._name = name

    @property
    def _docs(self) -> list[dict[str, Any]]:
        return self._database._collections.setdefault(self._name, [])

    async def create_indexes(self, _indexes: list[Any]):
        return []

    async def find_one(self, query: dict[str, Any]) -> dict[str, Any] | None:
        for doc in self._docs:
            if _matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: dict[str, Any]) -> LocalCursor:
        docs = [dict(doc) for doc in self._docs if _matches(doc, query)]
        return LocalCursor(docs)

    async def count_documents(self, query: dict[str, Any]) -> int:
        return sum(1 for doc in self._docs if _matches(doc, query))

    async def insert_one(self, document: dict[str, Any]) -> InsertOneResult:
        doc = dict(document)
        doc.setdefault("_id", ObjectId())
        self._docs.append(doc)
        self._database._save()
        return InsertOneResult(inserted_id=doc["_id"])

    async def update_one(self, query: dict[str, Any], update: dict[str, Any]) -> UpdateResult:
        for index, doc in enumerate(self._docs):
            if not _matches(doc, query):
                continue

            updated = dict(doc)
            for key, value in update.get("$set", {}).items():
                updated[key] = value
            for key, value in update.get("$inc", {}).items():
                updated[key] = updated.get(key, 0) + value

            self._docs[index] = updated
            self._database._save()
            return UpdateResult(modified_count=1)
        return UpdateResult(modified_count=0)

    async def delete_one(self, query: dict[str, Any]) -> DeleteResult:
        for index, doc in enumerate(self._docs):
            if _matches(doc, query):
                del self._docs[index]
                self._database._save()
                return DeleteResult(deleted_count=1)
        return DeleteResult(deleted_count=0)

    async def delete_many(self, query: dict[str, Any]) -> DeleteResult:
        original = len(self._docs)
        self._database._collections[self._name] = [doc for doc in self._docs if not _matches(doc, query)]
        deleted_count = original - len(self._database._collections[self._name])
        if deleted_count:
            self._database._save()
        return DeleteResult(deleted_count=deleted_count)


class LocalDatabase:
    def __init__(self, data_file: Path = DATA_FILE):
        self._data_file = data_file
        self._collections: dict[str, list[dict[str, Any]]] = {"users": [], "detections": []}
        self._load()
        self.users = LocalCollection(self, "users")
        self.detections = LocalCollection(self, "detections")

    def _load(self):
        if not self._data_file.exists():
            return
        payload = json.loads(self._data_file.read_text(encoding="utf-8"))
        self._collections = _from_jsonable(payload)

    def _save(self):
        self._data_file.write_text(
            json.dumps(_to_jsonable(self._collections), indent=2),
            encoding="utf-8",
        )
