#!/usr/bin/env python3
"""
Simple script to create test users via direct database access
"""
import sys
sys.path.insert(0, '/Users/pyjuan91/Programs/Limira/backend')

from app.core.database import SessionLocal
from app.models.user import User, UserRole
from passlib.context import CryptContext

# Simple password hashing without bcrypt issues
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def create_test_users():
    db = SessionLocal()

    try:
        # Check if users already exist
        existing_inventor = db.query(User).filter(User.email == 'inventor@test.com').first()
        existing_attorney = db.query(User).filter(User.email == 'attorney@test.com').first()

        if existing_inventor:
            print('⚠️  Inventor account already exists')
        else:
            # Create inventor test account
            inventor = User(
                email='inventor@test.com',
                hashed_password=pwd_context.hash('password123'),
                role=UserRole.INVENTOR,
                full_name='John Inventor',
                company='Tech Innovations Inc'
            )
            db.add(inventor)
            print('✅ Created inventor account')

        if existing_attorney:
            print('⚠️  Attorney account already exists')
        else:
            # Create attorney test account
            attorney = User(
                email='attorney@test.com',
                hashed_password=pwd_context.hash('password123'),
                role=UserRole.LAWYER,
                full_name='Sarah Attorney',
                company='IP Law Firm'
            )
            db.add(attorney)
            print('✅ Created attorney account')

        db.commit()

        print('\n' + '='*60)
        print('📋 Test Accounts:')
        print('='*60)
        print('\n🔬 Inventor Account:')
        print('   Email: inventor@test.com')
        print('   Password: password123')
        print('   Login URL: http://localhost:5173/login/inventor')

        print('\n⚖️  Attorney Account:')
        print('   Email: attorney@test.com')
        print('   Password: password123')
        print('   Login URL: http://localhost:5173/login/attorney')
        print('\n' + '='*60)

    except Exception as e:
        print(f'❌ Error: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    create_test_users()
