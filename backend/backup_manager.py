"""
Database Backup Manager for DermAI
Implements automated backup strategy with multiple storage tiers
"""

import os
import sys
import subprocess
import shutil
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import sqlite3
import gzip
import hashlib
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BackupManager:
    """Manages database backups for DermAI"""

    def __init__(self, db_path: str = "test.db", backup_dir: str = "backups"):
        """
        Initialize backup manager

        Args:
            db_path: Path to SQLite database file
            backup_dir: Directory to store backups
        """
        self.db_path = db_path
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(parents=True, exist_ok=True)

        # Backup retention settings
        self.daily_retention_days = 7
        self.weekly_retention_days = 30
        self.monthly_retention_days = 365

        self.backup_manifest = self.backup_dir / "manifest.json"

    def _load_manifest(self) -> Dict:
        """Load backup manifest"""
        if self.backup_manifest.exists():
            try:
                with open(self.backup_manifest, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load manifest: {e}")
        return {"backups": []}

    def _save_manifest(self, manifest: Dict):
        """Save backup manifest"""
        try:
            with open(self.backup_manifest, 'w') as f:
                json.dump(manifest, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save manifest: {e}")

    def _calculate_checksum(self, filepath: Path) -> str:
        """Calculate SHA256 checksum of file"""
        sha256_hash = hashlib.sha256()
        with open(filepath, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()

    def create_full_backup(self) -> Tuple[bool, str]:
        """
        Create a full backup of the database

        Returns:
            Tuple of (success, backup_path_or_error_message)
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"backup_full_{timestamp}.db.gz"
            backup_path = self.backup_dir / backup_filename

            logger.info(f"Starting full backup: {backup_filename}")

            # Create backup
            if not self._backup_sqlite_database(backup_path):
                return False, f"Failed to backup database to {backup_path}"

            # Calculate checksum
            checksum = self._calculate_checksum(backup_path)

            # Get file size
            file_size = backup_path.stat().st_size

            # Update manifest
            manifest = self._load_manifest()
            backup_info = {
                "type": "full",
                "filename": backup_filename,
                "timestamp": datetime.now().isoformat(),
                "size_bytes": file_size,
                "checksum_sha256": checksum,
                "source_db": self.db_path,
                "retention_until": (datetime.now() + timedelta(days=self.monthly_retention_days)).isoformat()
            }
            manifest["backups"].append(backup_info)
            self._save_manifest(manifest)

            logger.info(f"✅ Full backup completed: {backup_path} ({file_size} bytes)")
            return True, str(backup_path)

        except Exception as e:
            logger.error(f"❌ Full backup failed: {e}")
            return False, str(e)

    def create_incremental_backup(self) -> Tuple[bool, str]:
        """
        Create an incremental backup

        For SQLite, this is a copy of the database at a point in time

        Returns:
            Tuple of (success, backup_path_or_error_message)
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"backup_incremental_{timestamp}.db.gz"
            backup_path = self.backup_dir / backup_filename

            logger.info(f"Starting incremental backup: {backup_filename}")

            # Create backup
            if not self._backup_sqlite_database(backup_path):
                return False, f"Failed to backup database to {backup_path}"

            # Calculate checksum
            checksum = self._calculate_checksum(backup_path)

            # Get file size
            file_size = backup_path.stat().st_size

            # Update manifest
            manifest = self._load_manifest()
            backup_info = {
                "type": "incremental",
                "filename": backup_filename,
                "timestamp": datetime.now().isoformat(),
                "size_bytes": file_size,
                "checksum_sha256": checksum,
                "source_db": self.db_path,
                "retention_until": (datetime.now() + timedelta(days=self.daily_retention_days)).isoformat()
            }
            manifest["backups"].append(backup_info)
            self._save_manifest(manifest)

            logger.info(f"✅ Incremental backup completed: {backup_path} ({file_size} bytes)")
            return True, str(backup_path)

        except Exception as e:
            logger.error(f"❌ Incremental backup failed: {e}")
            return False, str(e)

    def _backup_sqlite_database(self, backup_path: Path) -> bool:
        """
        Backup SQLite database with compression

        Args:
            backup_path: Path where compressed backup should be saved

        Returns:
            True if successful, False otherwise
        """
        try:
            # Read database file
            with open(self.db_path, 'rb') as f:
                db_data = f.read()

            # Compress and write
            with gzip.open(backup_path, 'wb') as f:
                f.write(db_data)

            return True

        except Exception as e:
            logger.error(f"Error backing up SQLite database: {e}")
            return False

    def restore_backup(self, backup_filename: str) -> Tuple[bool, str]:
        """
        Restore database from backup

        Args:
            backup_filename: Name of backup file to restore

        Returns:
            Tuple of (success, message)
        """
        try:
            backup_path = self.backup_dir / backup_filename
            if not backup_path.exists():
                return False, f"Backup file not found: {backup_filename}"

            logger.info(f"Starting restore from: {backup_filename}")

            # Create a backup of current database first
            current_backup = self.backup_dir / f"pre_restore_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db.gz"
            if Path(self.db_path).exists():
                self._backup_sqlite_database(current_backup)
                logger.info(f"Current database backed up to: {current_backup}")

            # Decompress backup
            with gzip.open(backup_path, 'rb') as f:
                db_data = f.read()

            # Write restored data
            with open(self.db_path, 'wb') as f:
                f.write(db_data)

            # Verify integrity
            try:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute("PRAGMA integrity_check")
                result = cursor.fetchone()
                conn.close()

                if result[0] == "ok":
                    logger.info(f"✅ Restore completed successfully from {backup_filename}")
                    return True, f"Database restored from {backup_filename}"
                else:
                    logger.error(f"Database integrity check failed: {result}")
                    return False, f"Restored database failed integrity check: {result}"

            except Exception as e:
                logger.error(f"Failed to verify restored database: {e}")
                return False, f"Failed to verify restored database: {e}"

        except Exception as e:
            logger.error(f"❌ Restore failed: {e}")
            return False, str(e)

    def cleanup_old_backups(self) -> Dict:
        """
        Remove old backups according to retention policy

        Returns:
            Dictionary with cleanup statistics
        """
        logger.info("Running backup cleanup")

        manifest = self._load_manifest()
        now = datetime.now()

        deleted_count = 0
        freed_space = 0
        kept_count = 0

        backups_to_keep = []

        for backup in manifest.get("backups", []):
            backup_path = self.backup_dir / backup["filename"]
            retention_until = datetime.fromisoformat(backup["retention_until"])

            if now > retention_until and backup_path.exists():
                logger.info(f"Deleting old backup: {backup['filename']}")
                try:
                    freed_space += backup["size_bytes"]
                    backup_path.unlink()
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Failed to delete {backup['filename']}: {e}")
                    backups_to_keep.append(backup)
            else:
                kept_count += 1
                backups_to_keep.append(backup)

        manifest["backups"] = backups_to_keep
        self._save_manifest(manifest)

        logger.info(f"Cleanup completed: {deleted_count} deleted, {kept_count} kept, {freed_space} bytes freed")

        return {
            "deleted_count": deleted_count,
            "kept_count": kept_count,
            "freed_space_bytes": freed_space
        }

    def list_backups(self) -> List[Dict]:
        """
        List all available backups

        Returns:
            List of backup information dictionaries
        """
        manifest = self._load_manifest()
        return manifest.get("backups", [])

    def verify_backup(self, backup_filename: str) -> Tuple[bool, str]:
        """
        Verify backup integrity

        Args:
            backup_filename: Name of backup to verify

        Returns:
            Tuple of (is_valid, message)
        """
        try:
            backup_path = self.backup_dir / backup_filename
            if not backup_path.exists():
                return False, f"Backup file not found: {backup_filename}"

            logger.info(f"Verifying backup: {backup_filename}")

            # Verify checksum
            manifest = self._load_manifest()
            backup_info = None
            for backup in manifest.get("backups", []):
                if backup["filename"] == backup_filename:
                    backup_info = backup
                    break

            if not backup_info:
                return False, f"Backup info not found in manifest: {backup_filename}"

            expected_checksum = backup_info["checksum_sha256"]
            actual_checksum = self._calculate_checksum(backup_path)

            if expected_checksum != actual_checksum:
                return False, f"Checksum mismatch! Expected: {expected_checksum}, Got: {actual_checksum}"

            # Verify file integrity (try to decompress)
            try:
                with gzip.open(backup_path, 'rb') as f:
                    data = f.read()
                logger.info(f"✅ Backup verified successfully: {backup_filename} ({len(data)} bytes uncompressed)")
                return True, f"Backup is valid ({len(data)} bytes uncompressed)"
            except Exception as e:
                return False, f"Failed to decompress backup: {e}"

        except Exception as e:
            logger.error(f"Verification failed: {e}")
            return False, str(e)

    def get_backup_stats(self) -> Dict:
        """
        Get backup storage statistics

        Returns:
            Dictionary with backup statistics
        """
        manifest = self._load_manifest()
        backups = manifest.get("backups", [])

        total_backups = len(backups)
        total_size = sum(b.get("size_bytes", 0) for b in backups)
        by_type = {}

        for backup in backups:
            backup_type = backup.get("type", "unknown")
            if backup_type not in by_type:
                by_type[backup_type] = {"count": 0, "size": 0}
            by_type[backup_type]["count"] += 1
            by_type[backup_type]["size"] += backup.get("size_bytes", 0)

        return {
            "total_backups": total_backups,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "by_type": by_type,
            "backup_dir": str(self.backup_dir),
            "oldest_backup": min((b["timestamp"] for b in backups), default=None),
            "newest_backup": max((b["timestamp"] for b in backups), default=None)
        }


def main():
    """Command-line interface for backup manager"""
    if len(sys.argv) < 2:
        print_help()
        return

    manager = BackupManager()
    command = sys.argv[1]

    if command == "full-backup":
        success, result = manager.create_full_backup()
        print(f"{'✅' if success else '❌'} {result}")

    elif command == "incremental-backup":
        success, result = manager.create_incremental_backup()
        print(f"{'✅' if success else '❌'} {result}")

    elif command == "list":
        backups = manager.list_backups()
        if not backups:
            print("No backups found")
        else:
            print("\nAvailable Backups:")
            print("-" * 100)
            for backup in backups:
                size_mb = backup.get("size_bytes", 0) / (1024 * 1024)
                print(f"  {backup['filename']}")
                print(f"    Type: {backup['type']}")
                print(f"    Created: {backup['timestamp']}")
                print(f"    Size: {size_mb:.2f} MB")
                print(f"    Checksum: {backup['checksum_sha256'][:16]}...")
                print()

    elif command == "restore":
        if len(sys.argv) < 3:
            print("Usage: python backup_manager.py restore <backup_filename>")
            return
        success, result = manager.restore_backup(sys.argv[2])
        print(f"{'✅' if success else '❌'} {result}")

    elif command == "verify":
        if len(sys.argv) < 3:
            print("Usage: python backup_manager.py verify <backup_filename>")
            return
        success, result = manager.verify_backup(sys.argv[2])
        print(f"{'✅' if success else '❌'} {result}")

    elif command == "cleanup":
        stats = manager.cleanup_old_backups()
        print(f"Cleanup completed:")
        print(f"  Deleted: {stats['deleted_count']} backups")
        print(f"  Kept: {stats['kept_count']} backups")
        print(f"  Freed: {stats['freed_space_bytes'] / (1024*1024):.2f} MB")

    elif command == "stats":
        stats = manager.get_backup_stats()
        print("\nBackup Statistics:")
        print(f"  Total Backups: {stats['total_backups']}")
        print(f"  Total Size: {stats['total_size_mb']} MB")
        print(f"  Storage: {stats['backup_dir']}")
        if stats['oldest_backup']:
            print(f"  Oldest: {stats['oldest_backup']}")
        if stats['newest_backup']:
            print(f"  Newest: {stats['newest_backup']}")
        print(f"  By Type:")
        for backup_type, info in stats['by_type'].items():
            print(f"    {backup_type}: {info['count']} backups ({info['size']/(1024*1024):.2f} MB)")

    else:
        print(f"Unknown command: {command}")
        print_help()


def print_help():
    """Print help message"""
    print("""
DermAI Backup Manager

Usage:
  python backup_manager.py <command> [arguments]

Commands:
  full-backup           Create a full backup of the database
  incremental-backup    Create an incremental backup
  list                  List all available backups
  restore <filename>    Restore database from backup
  verify <filename>     Verify backup integrity
  cleanup               Remove old backups (retention policy)
  stats                 Show backup statistics

Examples:
  python backup_manager.py full-backup
  python backup_manager.py list
  python backup_manager.py restore backup_full_20251127_203000.db.gz
  python backup_manager.py verify backup_full_20251127_203000.db.gz
  python backup_manager.py stats
""")


if __name__ == "__main__":
    main()
