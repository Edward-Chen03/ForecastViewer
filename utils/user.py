from supabase import create_client, Client
from config import Config

supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)

def get_user_id_by_email(email):
    user_response = supabase.table('users').select("id").eq('email', email).execute()
    if not user_response.data:
        raise ValueError('User not found')
    return user_response.data[0]['id']

def create_user(email):
    new_user = {'email': email}
    response = supabase.table('users').insert(new_user).execute()
    return response.data[0]

def get_user_by_email(email):
    response = supabase.table('users').select("*").eq('email', email).execute()
    return response.data[0] if response.data else None

def validate_email(email):
    if not email:
        return False, 'Email is required'
    
    if '@' not in email or '.' not in email:
        return False, 'Invalid email format'
    
    return True, ''