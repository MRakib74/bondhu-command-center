from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Customer(Base):
    """Command Center-এর কাস্টমার ডেটাবেজ (BondhuMart থেকে ইম্পোর্ট করা)"""
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    phone = Column(String, unique=True, index=True)
    address = Column(Text, nullable=True)
    district = Column(String, nullable=True)
    
    # AI Filtering Fields
    has_whatsapp = Column(Boolean, default=False)
    whatsapp_checked_at = Column(DateTime, nullable=True)
    
    # Purchase History Summary (Synced from BondhuMart)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    customer_segment = Column(String, default="new") # VIP, Hot, Inactive
    last_purchased_products = Column(JSON, default=list) # শেষ কি কিনেছে তার লিস্ট
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    broadcast_logs = relationship("BroadcastLog", back_populates="customer")
    cc_orders = relationship("CCOrder", back_populates="customer")


class BroadcastCampaign(Base):
    """ব্রডকাস্ট ক্যাম্পেইনের তথ্য"""
    __tablename__ = "broadcast_campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    message_template = Column(Text)
    target_segment = Column(String) # VIP, All, Shirt_Buyers
    channel = Column(String) # whatsapp, sms
    
    total_sent = Column(Integer, default=0)
    total_failed = Column(Integer, default=0)
    total_replied = Column(Integer, default=0) # AI ট্র্যাকিং
    
    created_at = Column(DateTime, default=datetime.utcnow)

    logs = relationship("BroadcastLog", back_populates="campaign")


class BroadcastLog(Base):
    """কাকে কবে কী মেসেজ দেওয়া হয়েছে তার লগ"""
    __tablename__ = "broadcast_logs"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("broadcast_campaigns.id"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    
    message_sent = Column(Text)
    status = Column(String) # sent, failed, delivered, read
    error_message = Column(Text, nullable=True)
    
    sent_at = Column(DateTime, default=datetime.utcnow)
    
    campaign = relationship("BroadcastCampaign", back_populates="logs")
    customer = relationship("Customer", back_populates="broadcast_logs")


class CCOrder(Base):
    """Command Center-এর নিজস্ব অর্ডার (AI বা ম্যানুয়ালি তৈরি)"""
    __tablename__ = "cc_orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    
    items = Column(JSON) # কী কী প্রোডাক্ট
    total_amount = Column(Float)
    
    status = Column(String, default="pending") # pending, confirmed, shipped, delivered
    courier_name = Column(String, nullable=True) # steadfast, pathao
    tracking_code = Column(String, nullable=True)
    invoice_url = Column(String, nullable=True)
    
    created_by = Column(String, default="admin") # admin, ai_bot
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="cc_orders")
