#!/usr/bin/env python3
"""Create admin profile in Supabase database"""
from app.db.session import get_db
from sqlalchemy import text

db = next(get_db())

# Admin UUID from auth.users (from AUTHENTICATION_SETUP.md)
admin_uuid = '6c8e83d3-f8b9-4e6a-9ab1-a87b59bb7bea'

# Check if profile exists
result = db.execute(text('SELECT id FROM profiles WHERE id = :id'), {'id': admin_uuid})
exists = result.fetchone() is not None

if exists:
    print(f'✅ Profile already exists')
    # Update to ensure it's active
    db.execute(text('''
        UPDATE profiles 
        SET is_active = true, is_verified = true, role = 'ADMIN'
        WHERE id = :id
    '''), {'id': admin_uuid})
    db.commit()
    print('✅ Profile updated to active')
else:
    print(f'Creating profile...')
    db.execute(text('''
        INSERT INTO profiles (id, email, full_name, role, is_active, is_verified)
        VALUES (:id, :email, :full_name, :role, true, true)
    '''), {
        'id': admin_uuid,
        'email': 'admin@dermai.com',
        'full_name': 'Administrateur DermAI',
        'role': 'ADMIN'
    })
    db.commit()
    print('✅ Profile created')

# Verify
result = db.execute(text('''
    SELECT email, full_name, role, is_active, is_verified 
    FROM profiles WHERE id = :id
'''), {'id': admin_uuid})

for row in result:
    print(f'\n📋 Profile:')
    print(f'   Email: {row[0]}')
    print(f'   Name: {row[1]}')
    print(f'   Role: {row[2]}')
    print(f'   Active: {row[3]}')
    print(f'   Verified: {row[4]}')
