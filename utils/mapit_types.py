MAPIT_STC_TYPES = ["LBO", "UTA", "COI", "LGD", "CTY", "MTD"]
MAPIT_DIS_TYPES = ["DIS", "NMD"]
MAPIT_COUNCIL_TYPES = MAPIT_STC_TYPES + MAPIT_DIS_TYPES
LIH_COUNCIL_TYPES = ["DIS", "STC"]
MAPIT_WARD_TYPES = ["COI", "CPW", "DIW", "LBW", "LGW", "MTW", "UTE", "UTW"]

boundary_types = [
    {
        "mapit_type": ["WMC"],
        "name": "2023 Parliamentary Constituency",
        "code": "WMC23",
        "area_type": "Westminster Constituency",
        "description": "Westminster Parliamentary Constituency boundaries, as created in 2023",
    },
    {
        "mapit_type": MAPIT_STC_TYPES,
        "name": "Single Tier Councils",
        "code": "STC",
        "area_type": "Single Tier Council",
        "description": "Single Tier Council",
    },
    {
        "mapit_type": MAPIT_DIS_TYPES,
        "name": "District Councils",
        "code": "DIS",
        "area_type": "District Council",
        "description": "District Council",
    },
    {
        "mapit_type": MAPIT_WARD_TYPES,
        "name": "Wards",
        "code": "WD23",
        "area_type": "Electoral Ward",
        "description": "Electoral wards",
    },
]
