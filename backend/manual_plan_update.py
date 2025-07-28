#!/usr/bin/env python3
"""
Manual Plan Update Script
Allows administrators to manually update user subscription plans
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import sys
import argparse
from auth_models import SUBSCRIPTION_PLANS

# Initialize Firebase
try:
    firebase_admin.initialize_app()
    print("✅ Firebase initialized")
except ValueError:
    print("ℹ️  Firebase already initialized")

db = firestore.client()

def get_user_by_email(email: str):
    """Get user by email"""
    try:
        users = db.collection('users').where('email', '==', email).limit(1).get()
        for user in users:
            user_data = user.to_dict()
            user_data['id'] = user.id
            return user_data
        return None
    except Exception as e:
        print(f"❌ Error getting user: {e}")
        return None

def update_user_plan(user_id: str, new_plan: str, reset_credits: bool = False):
    """Update user's subscription plan"""
    try:
        if new_plan not in SUBSCRIPTION_PLANS:
            print(f"❌ Invalid plan: {new_plan}")
            print(f"Available plans: {list(SUBSCRIPTION_PLANS.keys())}")
            return False
        
        plan_config = SUBSCRIPTION_PLANS[new_plan]
        
        update_data = {
            'subscription_plan': new_plan,
            'basic_credits_limit': plan_config['basic_credits_limit'],
            'premium_credits_limit': plan_config['premium_credits_limit']
        }
        
        if reset_credits:
            update_data.update({
                'basic_credits_used': 0,
                'premium_credits_used': 0.0,
                'last_credit_usage': datetime.utcnow()
            })
        
        user_ref = db.collection('users').document(user_id)
        user_ref.update(update_data)
        
        print(f"✅ User {user_id} updated to {new_plan} plan")
        if reset_credits:
            print("✅ Credits reset to 0")
        return True
        
    except Exception as e:
        print(f"❌ Error updating user: {e}")
        return False

def show_user_info(user_data):
    """Display user information"""
    print(f"\n📋 User Information:")
    print(f"   ID: {user_data['id']}")
    print(f"   Email: {user_data['email']}")
    print(f"   Current Plan: {user_data.get('subscription_plan', 'free')}")
    print(f"   Basic Credits: {user_data.get('basic_credits_used', 0)} / {user_data.get('basic_credits_limit', 200)}")
    print(f"   Premium Credits: {user_data.get('premium_credits_used', 0)} / {user_data.get('premium_credits_limit', 35)}")
    print(f"   Created: {user_data.get('created_at', 'Unknown')}")

def show_plan_info(plan_name: str):
    """Display plan information"""
    if plan_name not in SUBSCRIPTION_PLANS:
        print(f"❌ Invalid plan: {plan_name}")
        return
    
    plan = SUBSCRIPTION_PLANS[plan_name]
    print(f"\n📋 Plan Information - {plan_name.upper()}:")
    print(f"   Basic Credits: {plan['basic_credits_limit']}")
    print(f"   Premium Credits: {plan['premium_credits_limit']}")
    print(f"   Price: ${plan['price_per_month']}/month")

def main():
    parser = argparse.ArgumentParser(description='Manually update user subscription plans')
    parser.add_argument('email', help='User email address')
    parser.add_argument('plan', choices=list(SUBSCRIPTION_PLANS.keys()), help='New subscription plan')
    parser.add_argument('--reset-credits', action='store_true', help='Reset credit usage to 0')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be changed without making changes')
    
    args = parser.parse_args()
    
    print(f"🔍 Looking up user: {args.email}")
    user = get_user_by_email(args.email)
    
    if not user:
        print(f"❌ User not found: {args.email}")
        return
    
    show_user_info(user)
    show_plan_info(args.plan)
    
    if args.dry_run:
        print(f"\n🔍 DRY RUN - Would update user to {args.plan} plan")
        if args.reset_credits:
            print("🔍 Would reset credits to 0")
        return
    
    # Confirm the change
    print(f"\n⚠️  Are you sure you want to update {user['email']} to {args.plan} plan?")
    if args.reset_credits:
        print("⚠️  This will also reset their credits to 0")
    
    confirm = input("Type 'yes' to confirm: ")
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled")
        return
    
    # Perform the update
    success = update_user_plan(user['id'], args.plan, args.reset_credits)
    
    if success:
        print(f"\n✅ Successfully updated {user['email']} to {args.plan} plan")
        
        # Show updated user info
        updated_user = get_user_by_email(args.email)
        if updated_user:
            show_user_info(updated_user)
    else:
        print(f"\n❌ Failed to update user plan")

if __name__ == "__main__":
    main() 