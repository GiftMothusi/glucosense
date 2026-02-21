import httpx
import logging
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.models import FoodDatabase

logger = logging.getLogger(__name__)

OFF_SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl"
OFF_BARCODE_URL = "https://world.openfoodfacts.org/api/v0/product/{barcode}.json"

HTTP_TIMEOUT = 8.0


def _parse_off_product(product: dict) -> Optional[dict]:
   
    name = (
        product.get("product_name")
        or product.get("product_name_en")
        or ""
    ).strip()

    if not name:
        return None

    nutriments = product.get("nutriments", {})

    return {
        "external_id": product.get("_id") or product.get("id"),
        "barcode":     product.get("code") or product.get("_id"),
        "name":        name,
        "brand":       (product.get("brands") or "").strip() or None,
        "carbs_per_100g":    float(nutriments.get("carbohydrates_100g") or 0),
        "protein_per_100g":  float(nutriments.get("proteins_100g") or 0),
        "fat_per_100g":      float(nutriments.get("fat_100g") or 0),
        "calories_per_100g": float(
            nutriments.get("energy-kcal_100g")
            or nutriments.get("energy_100g", 0)
        ),
        "fiber_per_100g":    float(nutriments.get("fiber_100g") or 0),
        "glycemic_index":    None,  
        "source":            "openfoodfacts",
    }


async def _save_to_cache(db: AsyncSession, parsed: dict) -> FoodDatabase:
    existing = None

    if parsed.get("external_id"):
        result = await db.execute(
            select(FoodDatabase).where(
                FoodDatabase.external_id == parsed["external_id"]
            )
        )
        existing = result.scalar_one_or_none()

    if existing:
        for key, value in parsed.items():
            setattr(existing, key, value)
        await db.commit()
        await db.refresh(existing)
        return existing

    food = FoodDatabase(**parsed)
    db.add(food)
    await db.commit()
    await db.refresh(food)
    return food


class FoodService:

    @staticmethod
    async def search(
        db: AsyncSession,
        query: str,
        limit: int = 10,
    ) -> list[FoodDatabase]:
        
        query_clean = query.strip()

        local_result = await db.execute(
            select(FoodDatabase)
            .where(FoodDatabase.name.ilike(f"%{query_clean}%"))
            .limit(limit)
        )
        local_foods = local_result.scalars().all()

        if len(local_foods) >= 3:
            return list(local_foods)

        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                response = await client.get(
                    OFF_SEARCH_URL,
                    params={
                        "search_terms":   query_clean,
                        "json":           "1",
                        "page_size":      str(limit),
                        "fields": (
                            "_id,code,product_name,product_name_en,"
                            "brands,nutriments"
                        ),
                    },
                )
                response.raise_for_status()
                data = response.json()
        except Exception as e:
            logger.warning(f"OpenFoodFacts search failed for '{query_clean}': {e}")
            return list(local_foods)

        seen_ids = {f.external_id for f in local_foods if f.external_id}
        new_foods = []

        for product in data.get("products", []):
            parsed = _parse_off_product(product)
            if not parsed:
                continue
            if parsed["external_id"] in seen_ids:
                continue
            seen_ids.add(parsed["external_id"])
            try:
                food = await _save_to_cache(db, parsed)
                new_foods.append(food)
            except Exception as e:
                logger.warning(f"Failed to cache food '{parsed['name']}': {e}")

        return list(local_foods) + new_foods

    @staticmethod
    async def barcode_lookup(
        db: AsyncSession,
        barcode: str,
    ) -> Optional[FoodDatabase]:
       
        local_result = await db.execute(
            select(FoodDatabase).where(FoodDatabase.barcode == barcode)
        )
        food = local_result.scalar_one_or_none()

        if food:
            return food

        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                response = await client.get(
                    OFF_BARCODE_URL.format(barcode=barcode),
                    params={
                        "fields": (
                            "_id,code,product_name,product_name_en,"
                            "brands,nutriments"
                        )
                    },
                )
                response.raise_for_status()
                data = response.json()
        except Exception as e:
            logger.warning(f"OpenFoodFacts barcode lookup failed for '{barcode}': {e}")
            return None

        if data.get("status") != 1:
            return None

        product = data.get("product", {})
        product["code"] = barcode 

        parsed = _parse_off_product(product)
        if not parsed:
            return None

        try:
            return await _save_to_cache(db, parsed)
        except Exception as e:
            logger.warning(f"Failed to cache barcode '{barcode}': {e}")
            return None