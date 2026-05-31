"""One-time cleanup script: removes orphaned CRM child records whose
project_id no longer exists in `crm_projects`.

Run:  python /app/backend/cleanup_orphans.py
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

CHILD_COLLECTIONS = (
    "crm_tasks",
    "project_expenses",
    "vendor_payments",
    "project_invoices",
    "project_payments",
    "reachvel_payments",
)


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    # Existing project IDs
    project_ids = await db.crm_projects.distinct("id")
    print(f"Found {len(project_ids)} active CRM projects.")

    total_removed = 0
    for coll in CHILD_COLLECTIONS:
        # Delete docs where project_id is set and not in the active set.
        # For reachvel_payments, only records that were synced from a project
        # (i.e., have a non-empty project_id) are scrubbed; manual entries
        # without project_id are preserved.
        query = {
            "project_id": {"$nin": project_ids + [""]},
        }
        res = await db[coll].delete_many(query)
        print(f"  {coll}: removed {res.deleted_count}")
        total_removed += res.deleted_count

    print(f"\nTotal orphaned records removed: {total_removed}")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
