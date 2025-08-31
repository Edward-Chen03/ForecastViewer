from supabase import create_client, Client
from config import Config

supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)


def find_or_create_location(name, latitude, longitude):
    rounded_lat = round(float(latitude), 4)
    rounded_lon = round(float(longitude), 4)

    try:
        lat_range = 0.00005
        lon_range = 0.00005

        existing_locations = (
            supabase.table("locations")
            .select("id, name, latitude, longitude")
            .gte("latitude", rounded_lat - lat_range)
            .lte("latitude", rounded_lat + lat_range)
            .gte("longitude", rounded_lon - lat_range)
            .lte("longitude", rounded_lon + lat_range)
            .execute()
        )

        for loc in existing_locations.data:
            existing_rounded_lat = round(float(loc["latitude"]), 4)
            existing_rounded_lon = round(float(loc["longitude"]), 4)

            if (
                existing_rounded_lat == rounded_lat
                and existing_rounded_lon == rounded_lon
            ):
                print(
                    f"Found existing location: {loc['name']} at {existing_rounded_lat}, {existing_rounded_lon}"
                )
                return loc["id"]

    except Exception as e:
        print(f"Error searching for existing location: {e}")

    new_location = {"name": name, "latitude": latitude, "longitude": longitude}

    try:
        response = supabase.table("locations").insert(new_location).execute()
        print(f"Created new location: {name} at {latitude}, {longitude}")
        return response.data[0]["id"]

    except Exception as e:
        error_msg = str(e).lower()

        if "duplicate key" in error_msg or "unique constraint" in error_msg:
            print(f"Unique constraint violation for {name}, searching again...")

            existing_locations = (
                supabase.table("locations")
                .select("id, name, latitude, longitude")
                .execute()
            )

            for loc in existing_locations.data:
                existing_rounded_lat = round(float(loc["latitude"]), 4)
                existing_rounded_lon = round(float(loc["longitude"]), 4)

                if (
                    existing_rounded_lat == rounded_lat
                    and existing_rounded_lon == rounded_lon
                ):
                    print(f"Found location after constraint violation: {loc['name']}")
                    return loc["id"]

            raise Exception(
                f"Could not find or create location {name} at {latitude}, {longitude}"
            )

        raise e


def get_user_locations(user_id):

    user_locations_response = (
        supabase.table("user_locations")
        .select("*, locations(*)")
        .eq("user_id", user_id)
        .order("added_at", desc=True)
        .execute()
    )

    formatted_locations = []
    for ul in user_locations_response.data:
        location = ul["locations"]
        formatted_locations.append(
            {
                "id": ul["id"],
                "name": ul["custom_name"] if ul["custom_name"] else location["name"],
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "created_at": ul["added_at"],
            }
        )

    return formatted_locations


def save_user_location(user_id, location_id, custom_name=None):

    existing_user_location = (
        supabase.table("user_locations")
        .select("*")
        .eq("user_id", user_id)
        .eq("location_id", location_id)
        .execute()
    )

    if existing_user_location.data:
        return None, "Location is already in your saved locations"

    new_user_location = {
        "user_id": user_id,
        "location_id": location_id,
        "custom_name": custom_name,
    }

    response = supabase.table("user_locations").insert(new_user_location).execute()
    return response.data[0], "Location added to your saved locations"


def remove_user_location(user_id, user_location_id):

    user_location_response = (
        supabase.table("user_locations")
        .select("custom_name, locations(name)")
        .eq("id", user_location_id)
        .eq("user_id", user_id)
        .execute()
    )

    if not user_location_response.data:
        return None, "Location not found"

    user_location = user_location_response.data[0]
    location_name = user_location["custom_name"] or user_location["locations"]["name"]

    supabase.table("user_locations").delete().eq("id", user_location_id).eq(
        "user_id", user_id
    ).execute()

    return location_name, f"Removed {location_name} from saved locations"


def get_user_location_with_details(user_id, user_location_id):
    
    user_location = (
        supabase.table("user_locations")
        .select("*, locations(*)")
        .eq("id", user_location_id)
        .eq("user_id", user_id)
        .execute()
    )

    return user_location.data[0] if user_location.data else None
