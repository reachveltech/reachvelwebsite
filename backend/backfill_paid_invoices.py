"""One-time backfill: ensure every `paid` invoice has a corresponding
auto-synced project_payment record. Re-running is safe (idempotent).

Run:  python /app/backend/backfill_paid_invoices.py
"""
import asyncio
import os
import uuid
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    paid = await db.project_invoices.find({"status": "paid"}, {"_id": 0}).to_list(10000)
    print(f"Found {len(paid)} paid invoices.")

    created = 0
    updated = 0
    for inv in paid:
        amt = float(inv.get("total", inv.get("amount", 0)) or 0)
        date = inv.get("issued_date") or (inv.get("updated_at", "") or "")[:10]
        desc = (f"Invoice {inv.get('invoice_number', '')}".strip()
                or inv.get("description") or "Invoice payment")
        existing = await db.project_payments.find_one(
            {"invoice_id": inv["id"], "auto_synced": True}
        )
        if existing:
            await db.project_payments.update_one(
                {"id": existing["id"]},
                {"$set": {
                    "amount": amt,
                    "project_id": inv.get("project_id", ""),
                    "date": date,
                    "notes": desc,
                    "updated_at": now_iso(),
                }},
            )
            updated += 1
        else:
            await db.project_payments.insert_one({
                "id": str(uuid.uuid4()),
                "project_id": inv.get("project_id", ""),
                "invoice_id": inv["id"],
                "amount": amt,
                "method": "Invoice",
                "date": date,
                "notes": desc,
                "auto_synced": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
            })
            created += 1

    print(f"Created {created} new auto-synced project_payments, updated {updated}.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
