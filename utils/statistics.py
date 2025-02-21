import hashlib
import re
import unicodedata
from enum import Enum
from typing import Any

from numpy import dtype
from pandas import Series

currency_symbols = "".join(
    chr(i) for i in range(0xFFFF) if unicodedata.category(chr(i)) == "Sc"
)


class StatisticalDataType(Enum):
    BOOL = "bool"
    INT = "int"
    FLOAT = "float"
    PERCENTAGE = "percentage"
    STRING = "string"
    UNKNOWN = "string"
    EMPTY = "empty"

    @classmethod
    def parse(cls, x: Any) -> tuple[Any, "StatisticalDataType"]:
        # 1. Simple typing
        if x is None:
            return x, cls.EMPTY

        if isinstance(x, bool):
            return x, cls.BOOL

        if isinstance(x, int):
            return x, cls.INT

        if isinstance(x, float):
            return x, cls.FLOAT

        # 2. Empty check
        x_str = str(x).strip()
        if not x_str:
            return x_str, cls.EMPTY

        # 3. Percentage parsing
        if (
            x_str[-1] == "%"
            and (parsed := parse_str_as_number(x_str[0:-1])) is not None
        ):
            parsed = parsed / 100
            return parsed, cls.PERCENTAGE

        # 4. Numeric parsing
        parsed = parse_str_as_number(x_str)
        if isinstance(parsed, int):
            return parsed, cls.INT

        if isinstance(parsed, float):
            return parsed, cls.FLOAT

        # 5. Check if original value was a non-numeric string
        if isinstance(x, str):
            return x.strip(), cls.STRING

        # 6. UNKNOWN base case
        return x, cls.UNKNOWN

    def get_python_type(self):
        _PYTHON_TYPES = {
            self.BOOL: bool,
            self.INT: int,
            self.FLOAT: float,
            self.PERCENTAGE: float,
            self.STRING: str,
            self.UNKNOWN: str,
            self.EMPTY: str,
        }
        return _PYTHON_TYPES.get(self, str)

    def get_database_type(self):
        _DB_TYPES = {
            self.BOOL: "bool",
            self.INT: "bigint",
            self.FLOAT: "float",
            self.PERCENTAGE: "float",
            self.STRING: "varchar",
            self.UNKNOWN: "varchar",
            self.EMPTY: "varchar",
        }
        return _DB_TYPES.get(self, "varchar")

    def get_statistical_type(self):
        _STAT_TYPES = {
            self.BOOL: "boolean",
            self.INT: "numerical",
            self.FLOAT: "numerical",
            self.PERCENTAGE: "percentage",
            self.STRING: "categorical",
            self.UNKNOWN: "categorical",
            self.EMPTY: "empty",
        }
        return _STAT_TYPES.get(self, "categorical")

    @classmethod
    def from_dtype(cls, dt: dtype) -> "StatisticalDataType":
        if dt == dtype("object"):
            return cls.STRING
        elif str(dt) == "category":
            return cls.STRING
        elif dt == dtype("int64"):
            return cls.INT
        elif dt == dtype("float64"):
            return cls.FLOAT
        elif dt == dtype("bool"):
            return cls.BOOL
        elif dt == dtype("datetime64") or str(dt).startswith("datetime64"):
            # TODO: implement datetime StatisticalDataType
            return cls.UNKNOWN
        elif dt == dtype("timedelta") or str(dt).startswith("timedelta"):
            # TODO: implement timedelta StatisticalDataType
            return cls.UNKNOWN
        else:
            return cls.UNKNOWN


def parse_and_type_json(json: dict) -> tuple[dict, dict[str, StatisticalDataType]]:
    """
    For all keys in the provided json, if they are numeric or a percentage,
    parse them into ints or floats. Returns a tuple: the parsed data,
    and a map of column name to data type.
    """
    parsed = {}
    column_types = {}
    for key, v in json.items():
        value, type = StatisticalDataType.parse(v)
        parsed[key] = value
        column_types[key] = type
    return parsed, column_types


def merge_column_types(
    target: dict[str, StatisticalDataType], extra: dict[str, StatisticalDataType]
) -> None:
    for key in extra.keys():
        # Record the data type of this key
        if key not in target:
            target[key] = extra[key]
        # If this key has a different type, and it is not EMPTY, mark as "unknown"
        elif extra[key] != StatisticalDataType.EMPTY and target[key] != extra[key]:
            target[key] = StatisticalDataType.UNKNOWN


def parse_str_as_number(x: str) -> int | float | None:
    if not re.search(r"\d", x):
        return None

    x = re.sub(rf"\s|\t|,|^[{currency_symbols}%]|[{currency_symbols}%]$", "", x)

    try:
        return int(x)
    except ValueError:
        try:
            v = float(x)
            # Don't allow Infinity – can't do stats with it anyway
            if v < float("inf") and v > float("-inf"):
                return v
        except ValueError:
            pass
    return None


def get_materialized_view_column_name(x: str) -> str:
    """
    Max Postgres column name length is 59. For longer
    JSON keys than this, truncate it and add a hash.
    """
    # Prepend with data_ to avoid clashes with other columns (e.g. "id")
    x = f"data_{x}"
    if len(x) < 60:
        return x

    return f"{x[0:51]}_{generate_hash(x)}"


def generate_hash(input_string: str) -> str:
    """Generate an 8-character hash from the input string."""
    hash_object = hashlib.sha256(input_string.encode())  # Use SHA-256 for hashing
    hash_hex = hash_object.hexdigest()[:8]  # Take the first 8 characters
    return hash_hex


def get_mode(series: Series):
    try:
        return series.mode()[0]
    except KeyError:
        return None
