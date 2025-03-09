import os
from typing import Any, Dict, Optional

from app.core.config import settings
from sqlalchemy import text
from sqlalchemy.orm import Session


def encrypt_json(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Encrypt sensitive fields in a JSON object using pgcrypto.

    This function encrypts specific sensitive fields in a health metric JSON object.
    The encryption is performed at the database level using pgcrypto.

    Args:
        db: Database session
        data: JSON data to encrypt

    Returns:
        Dict with sensitive fields encrypted
    """
    # Make a copy of the data to avoid modifying the original
    encrypted_data = data.copy()

    # Define sensitive fields that should be encrypted
    sensitive_fields = ["heart_rate", "blood_pressure", "weight", "body_fat", "blood_glucose", "medication", "notes"]

    # Encrypt sensitive fields if they exist in the data
    for field in sensitive_fields:
        if field in encrypted_data:
            # Use pgcrypto to encrypt the field
            result = db.execute(
                text("SELECT pgp_sym_encrypt(:data, :key, 'cipher-algo=aes256') as encrypted"),
                {"data": str(encrypted_data[field]), "key": settings.SECRET_KEY},
            ).fetchone()

            if result and result.encrypted:
                encrypted_data[field] = f"ENCRYPTED:{result.encrypted.tobytes().hex()}"

    return encrypted_data


def decrypt_json(db: Session, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Decrypt sensitive fields in a JSON object using pgcrypto.

    This function decrypts specific sensitive fields in a health metric JSON object
    that were previously encrypted using pgcrypto.

    Args:
        db: Database session
        data: JSON data with encrypted fields

    Returns:
        Dict with sensitive fields decrypted
    """
    # Make a copy of the data to avoid modifying the original
    decrypted_data = data.copy()

    # Decrypt any field that starts with "ENCRYPTED:"
    for field, value in decrypted_data.items():
        if isinstance(value, str) and value.startswith("ENCRYPTED:"):
            # Extract the encrypted data
            encrypted_hex = value[10:]  # Remove "ENCRYPTED:" prefix

            # Use pgcrypto to decrypt the field
            result = db.execute(
                text("SELECT pgp_sym_decrypt(decode(:data, 'hex'), :key) as decrypted"), {"data": encrypted_hex, "key": settings.SECRET_KEY}
            ).fetchone()

            if result and result.decrypted:
                # Try to convert back to original type if possible
                try:
                    # For numeric values
                    if result.decrypted.isdigit():
                        decrypted_data[field] = int(result.decrypted)
                    elif result.decrypted.replace(".", "", 1).isdigit():
                        decrypted_data[field] = float(result.decrypted)
                    else:
                        decrypted_data[field] = result.decrypted
                except (ValueError, AttributeError):
                    decrypted_data[field] = result.decrypted

    return decrypted_data
