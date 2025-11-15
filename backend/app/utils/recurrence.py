"""
RFC 5545 Recurrence Rule (RRULE) utilities and validation

This module provides utilities for validating, parsing, and expanding RFC 5545
recurrence rules used for recurring appointments.

Example RRULE formats:
- Daily: {"freq": "DAILY", "count": 10}
- Weekly on Monday/Wednesday/Friday: {"freq": "WEEKLY", "byday": "MO,WE,FR", "count": 12}
- Monthly on 15th: {"freq": "MONTHLY", "bymonthday": 15, "count": 12}
- Every 2 weeks until date: {"freq": "WEEKLY", "interval": 2, "until": "2025-12-31"}
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta, date
import re


# ============================================================================
# RFC 5545 Constants
# ============================================================================

VALID_FREQUENCIES = {"DAILY", "WEEKLY", "MONTHLY", "YEARLY"}
VALID_WEEKDAYS = {"MO", "TU", "WE", "TH", "FR", "SA", "SU"}
WEEKDAY_MAP = {
    "MO": 0,  # Monday
    "TU": 1,  # Tuesday
    "WE": 2,  # Wednesday
    "TH": 3,  # Thursday
    "FR": 4,  # Friday
    "SA": 5,  # Saturday
    "SU": 6,  # Sunday
}
REVERSE_WEEKDAY_MAP = {v: k for k, v in WEEKDAY_MAP.items()}


# ============================================================================
# Exceptions
# ============================================================================

class RecurrenceValidationError(ValueError):
    """Raised when recurrence rule validation fails"""
    pass


# ============================================================================
# RFC 5545 Validator & Parser
# ============================================================================


class RecurrenceValidator:
    """
    Validates and parses RFC 5545 recurrence rules.

    Handles validation of common recurrence patterns used in appointment scheduling.
    Provides expansion of rules to generate occurrence dates.
    """

    @staticmethod
    def validate_recurrence_rule(rule: Dict[str, Any]) -> bool:
        """
        Validate that a recurrence rule matches RFC 5545 format.

        Args:
            rule: Dictionary with recurrence rule parameters

        Returns:
            bool: True if rule is valid

        Raises:
            RecurrenceValidationError: If rule is invalid

        Example:
            >>> rule = {"freq": "WEEKLY", "byday": "MO,WE,FR", "count": 12}
            >>> RecurrenceValidator.validate_recurrence_rule(rule)
            True
        """
        if not isinstance(rule, dict):
            raise RecurrenceValidationError("Recurrence rule must be a dictionary")

        if "freq" not in rule:
            raise RecurrenceValidationError("Recurrence rule must include 'freq' field")

        freq = rule["freq"].upper()
        if freq not in VALID_FREQUENCIES:
            raise RecurrenceValidationError(
                f"Invalid frequency '{freq}'. Must be one of {VALID_FREQUENCIES}"
            )

        # Validate interval
        if "interval" in rule:
            interval = rule["interval"]
            if not isinstance(interval, int) or interval < 1:
                raise RecurrenceValidationError("Interval must be a positive integer")

        # Validate count
        if "count" in rule:
            count = rule["count"]
            if not isinstance(count, int) or count < 1:
                raise RecurrenceValidationError("Count must be a positive integer")

        # Validate until date
        if "until" in rule:
            until = rule["until"]
            if isinstance(until, str):
                try:
                    datetime.fromisoformat(until.replace("Z", "+00:00"))
                except (ValueError, AttributeError):
                    raise RecurrenceValidationError(f"Invalid until date: {until}")
            elif not isinstance(until, (datetime, date)):
                raise RecurrenceValidationError("Until must be a date string or datetime object")

        # Validate BYDAY
        if "byday" in rule:
            byday = rule["byday"]
            if isinstance(byday, str):
                days = byday.split(",")
                for day in days:
                    if day.strip().upper() not in VALID_WEEKDAYS:
                        raise RecurrenceValidationError(f"Invalid weekday: {day}")
            elif isinstance(byday, list):
                for day in byday:
                    if day.upper() not in VALID_WEEKDAYS:
                        raise RecurrenceValidationError(f"Invalid weekday: {day}")
            else:
                raise RecurrenceValidationError("BYDAY must be string or list")

        # Validate BYMONTHDAY
        if "bymonthday" in rule:
            bymonthday = rule["bymonthday"]
            if isinstance(bymonthday, int):
                if not (1 <= bymonthday <= 31 or -31 <= bymonthday <= -1):
                    raise RecurrenceValidationError("BYMONTHDAY must be between 1-31 or -31 to -1")
            elif isinstance(bymonthday, list):
                for day in bymonthday:
                    if not (1 <= day <= 31 or -31 <= day <= -1):
                        raise RecurrenceValidationError("BYMONTHDAY must be between 1-31 or -31 to -1")
            else:
                raise RecurrenceValidationError("BYMONTHDAY must be int or list")

        # Validate BYMONTH
        if "bymonth" in rule:
            bymonth = rule["bymonth"]
            if isinstance(bymonth, int):
                if not (1 <= bymonth <= 12):
                    raise RecurrenceValidationError("BYMONTH must be between 1-12")
            elif isinstance(bymonth, list):
                for month in bymonth:
                    if not (1 <= month <= 12):
                        raise RecurrenceValidationError("BYMONTH must be between 1-12")
            else:
                raise RecurrenceValidationError("BYMONTH must be int or list")

        return True

    @staticmethod
    def expand_recurrence(
        rule: Dict[str, Any],
        start_time: datetime,
        max_occurrences: int = 365,
    ) -> List[datetime]:
        """
        Expand a recurrence rule to generate occurrence datetimes.

        Args:
            rule: RFC 5545 recurrence rule dictionary
            start_time: Initial occurrence datetime (UTC)
            max_occurrences: Maximum occurrences to generate (default 365, safety limit)

        Returns:
            List of occurrence datetimes

        Raises:
            RecurrenceValidationError: If rule is invalid

        Example:
            >>> rule = {"freq": "WEEKLY", "byday": "MO,WE,FR", "count": 12}
            >>> start = datetime(2025, 1, 6, 9, 0, 0)  # Monday
            >>> occurrences = RecurrenceValidator.expand_recurrence(rule, start)
            >>> len(occurrences)
            12
        """
        # Validate rule
        RecurrenceValidator.validate_recurrence_rule(rule)

        occurrences = [start_time]
        freq = rule.get("freq", "DAILY").upper()
        interval = rule.get("interval", 1)
        count = rule.get("count")
        until = rule.get("until")

        # Parse until date if provided
        until_dt = None
        if until:
            if isinstance(until, str):
                until_dt = datetime.fromisoformat(until.replace("Z", "+00:00"))
            else:
                until_dt = datetime.combine(until, datetime.max.time())

        current = start_time
        iteration = 0

        while iteration < max_occurrences:
            iteration += 1

            # Check count limit
            if count and len(occurrences) >= count:
                break

            # Check until limit
            if until_dt and current >= until_dt:
                break

            # Generate next occurrence based on frequency
            if freq == "DAILY":
                current = current + timedelta(days=interval)
            elif freq == "WEEKLY":
                byday = rule.get("byday")
                if byday:
                    current = RecurrenceValidator._next_weekly_occurrence(current, byday, interval)
                else:
                    current = current + timedelta(weeks=interval)
            elif freq == "MONTHLY":
                current = RecurrenceValidator._next_monthly_occurrence(current, rule, interval)
            elif freq == "YEARLY":
                current = current + timedelta(days=365 * interval)

            # Check until again
            if until_dt and current > until_dt:
                break

            occurrences.append(current)

        return occurrences

    @staticmethod
    def _next_weekly_occurrence(
        current: datetime,
        byday: str | List[str],
        interval: int = 1
    ) -> datetime:
        """Calculate next occurrence for weekly recurrence with BYDAY."""
        # Parse BYDAY
        if isinstance(byday, str):
            days = [d.strip().upper() for d in byday.split(",")]
        else:
            days = [d.upper() for d in byday]

        day_numbers = sorted([WEEKDAY_MAP[d] for d in days])

        # Find next matching weekday
        current_weekday = current.weekday()
        next_datetime = current + timedelta(days=1)

        while True:
            if next_datetime.weekday() in day_numbers:
                return next_datetime
            next_datetime += timedelta(days=1)

            # Safety check to avoid infinite loops
            if (next_datetime - current).days > 365:
                return current + timedelta(weeks=interval)

    @staticmethod
    def _next_monthly_occurrence(
        current: datetime,
        rule: Dict[str, Any],
        interval: int = 1
    ) -> datetime:
        """Calculate next occurrence for monthly recurrence."""
        bymonthday = rule.get("bymonthday")

        if bymonthday:
            # Calculate next month
            if current.month == 12:
                next_month = current.replace(year=current.year + 1, month=1)
            else:
                next_month = current.replace(month=current.month + interval)

            # Handle day of month
            if isinstance(bymonthday, int):
                day = bymonthday if bymonthday > 0 else 31  # Simplified
            else:
                day = bymonthday[0] if bymonthday else current.day

            try:
                return next_month.replace(day=day)
            except ValueError:
                # Day doesn't exist in this month (e.g., Feb 31)
                # Return last day of month
                if next_month.month == 2:
                    return next_month.replace(day=28)
                elif next_month.month in (4, 6, 9, 11):
                    return next_month.replace(day=30)
                else:
                    return next_month.replace(day=31)
        else:
            # Same day of month, next month
            if current.month == 12:
                next_month = current.replace(year=current.year + 1, month=1)
            else:
                next_month = current.replace(month=current.month + interval)

            try:
                return next_month.replace(day=current.day)
            except ValueError:
                # Day doesn't exist, return last day of month
                return next_month.replace(day=28) if next_month.month == 2 else next_month.replace(day=30)

    @staticmethod
    def get_next_occurrence(
        rule: Dict[str, Any],
        start_time: datetime,
        after_time: datetime,
    ) -> Optional[datetime]:
        """
        Get the next occurrence after a given time.

        Args:
            rule: RFC 5545 recurrence rule dictionary
            start_time: Initial occurrence datetime (UTC)
            after_time: Find occurrences after this time

        Returns:
            Next occurrence datetime or None if recurrence has ended
        """
        # Expand a reasonable number of occurrences
        occurrences = RecurrenceValidator.expand_recurrence(rule, start_time, max_occurrences=1000)

        for occurrence in occurrences:
            if occurrence > after_time:
                return occurrence

        return None

    @staticmethod
    def get_previous_occurrence(
        rule: Dict[str, Any],
        start_time: datetime,
        before_time: datetime,
    ) -> Optional[datetime]:
        """
        Get the previous occurrence before a given time.

        Args:
            rule: RFC 5545 recurrence rule dictionary
            start_time: Initial occurrence datetime (UTC)
            before_time: Find occurrences before this time

        Returns:
            Previous occurrence datetime or None if no earlier occurrence
        """
        occurrences = RecurrenceValidator.expand_recurrence(rule, start_time, max_occurrences=1000)

        previous = None
        for occurrence in occurrences:
            if occurrence >= before_time:
                break
            previous = occurrence

        return previous


# ============================================================================
# Helper Functions
# ============================================================================

def is_valid_recurrence_rule(rule: Dict[str, Any]) -> bool:
    """
    Quick check if a recurrence rule is valid.

    Args:
        rule: Recurrence rule dictionary

    Returns:
        bool: True if valid, False otherwise
    """
    try:
        RecurrenceValidator.validate_recurrence_rule(rule)
        return True
    except RecurrenceValidationError:
        return False


def parse_byday_string(byday_str: str) -> List[str]:
    """
    Parse BYDAY string into list of weekday abbreviations.

    Args:
        byday_str: Comma-separated weekday abbreviations (e.g., "MO,WE,FR")

    Returns:
        List of uppercase weekday abbreviations
    """
    return [day.strip().upper() for day in byday_str.split(",")]
