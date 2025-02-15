import re
import unicodedata

import numpy as np
from pandas import Series, to_numeric

currency_symbols = "".join(
    chr(i) for i in range(0xFFFF) if unicodedata.category(chr(i)) == "Sc"
)


def attempt_interpret_series_as_number(series: Series):
    # cleanup
    series = series.apply(parse_as_number)
    return series


def attempt_interpret_series_as_percentage(series: Series):
    # cleanup
    series = attempt_interpret_series_as_number(series)
    # as percentage
    series = series / 100
    return series


def check_numeric(x):
    try:
        if isinstance(x, (int, float)):
            return True
        if x == "" or x is None:
            return True
        # check if any numeric values are in the string at all
        if re.search(r"\d", x):
            x = parse_as_number(x)
            return isinstance(x, (int, float, np.int64, np.float64))
    except Exception:
        pass
    return False


def check_percentage(x):
    try:
        if isinstance(x, (int, float)):
            return False
        if x == "" or x is None:
            # Allow blanks
            return True
        if x[-1] == "%":
            return check_numeric(x)
    except Exception:
        pass
    # If it's not blank and not a percentage...
    return False


def get_mode(series: Series):
    try:
        return series.mode()[0]
    except KeyError:
        return None


def parse_as_number(value: str | float | int | np.int64 | np.float64):
    try:
        initial_value = value
        if initial_value is None or initial_value == "":
            return None
        value = str(value)
        # Remove all spaces, tabs, commas, currency symbols and %
        # TODO: make this locale-aware
        value = re.sub(
            rf"\s|\t|,|^[{currency_symbols}%]|[{currency_symbols}%]$", "", value
        )
        # cast as float or int, depending on if there are any decimals:
        value = to_numeric(value)
        return value
    except Exception:
        return None
