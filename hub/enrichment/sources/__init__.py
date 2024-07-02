from .electoral_commission_postcode_lookup import electoral_commision_postcode_lookup

builtin_mapping_sources = {
    "postcodes.io": {
        "builtin": True,
        "slug": "postcodes.io",
        "name": "Postcodes.io",
        "author": "Ideal Postcodes",
        "description": "Adds UK postcode and associated data.",
        "description_url": "https://postcodes.io/docs#Data",
        "source_paths": [
            {
                "value": "parliamentary_constituency_2025",
                "label": "GE2024 Westminster Parliamentary Constituency",
                "description": "The Westminster Parliamentary Constituency code for each postcode.",
            },
            {
                "value": "parliamentary_constituency",
                "label": "GE2019 Westminster Parliamentary Constituency",
                "description": "The Westminster Parliamentary Constituency code for each postcode.",
            },
            {
                "value": "admin_district",
                "label": "District (Council/Local Authority)",
                "description": "The current district/unitary authority to which the postcode has been assigned.",
            },
            {
                "value": "admin_ward",
                "label": "Ward",
                "description": "The current administrative/electoral area to which the postcode has been assigned.",
            },
            {
                "value": "postcode",
                "label": "Postcode",
                "description": "All current (‘live’) postcodes within the United Kingdom, the Channel Islands and the Isle of Man, received monthly from Royal Mail. 2, 3 or 4-character outward code, single space and 3-character inward code.",
            },
            {
                "value": "parish",
                "label": "Parish (England)/community (Wales)",
                "description": "The smallest type of administrative area in England is the parish (also known as 'civil parish'); the equivalent units in Wales are communities.",
            },
            {
                "value": "admin_county",
                "label": "County",
                "description": "The current county to which the postcode has been assigned.",
            },
            {
                "value": "region",
                "label": "Region (formerly GOR)",
                "description": "The Region code for each postcode. The nine GORs were abolished on 1 April 2011 and are now known as ‘Regions’. They were the primary statistical subdivisions of England and also the areas in which the Government Offices for the Regions fulfilled their role. Each GOR covered a number of local authorities.",
            },
            {
                "value": "country",
                "label": "Country",
                "description": "The country (i.e. one of the four constituent countries of the United Kingdom or the Channel Islands or the Isle of Man) to which each postcode is assigned.",
            },
            {
                "value": "nhs_ha",
                "label": "Strategic Health Authority",
                "description": "The health area code for the postcode.",
            },
            {
                "value": "primary_care_trust",
                "label": "Primary Care Trust (PCT)",
                "description": "The code for the Primary Care areas in England, LHBs in Wales, CHPs in Scotland, LCG in Northern Ireland and PHD in the Isle of Man; there are no equivalent areas in the Channel Islands. Care Trust/ Care Trust Plus (CT)/ local health board (LHB)/ community health partnership (CHP)/ local commissioning group (LCG)/ primary healthcare directorate (PHD).",
            },
            {
                "value": "ccg",
                "label": "Sub ICB Location (LOC)/ Local Health Board (LHB)/ Community Health Partnership (CHP)/ Local Commissioning Group (LCG)/ Primary Healthcare Directorate (PHD)",
                "description": ". The code for the Sub ICB Locations in England, LHBs in Wales, CHPs in Scotland, LCG in Northern Ireland and PHD in the Isle of Man; there are no equivalent areas in the Channel Islands. This was formerly Clinical Commissioning Group. From July 2022, CCGs were replaced by Sub-ICB locations.",
            },
            {
                "value": "ced",
                "label": "County Electoral District",
                "description": "The county electoral division code for each English postcode. Pseudo codes are included for the remainder of the UK. The field will be null for English postcodes with no grid reference. English county councils use county electoral divisions (CED) to elect councillors. These CEDs must be confined within district boundaries, but need not be based on whole electoral wards. The only exceptions are the Isles of Scilly and the Greater London Authority (GLA). CEDs do not exist within UAs.",
            },
            {
                "value": "outcode",
                "label": "Outward Code",
                "description": 'The outward code is the part of the postcode before the single space in the middle. It is between two and four characters long. A few outward codes are non-geographic, not divulging where mail is to be sent. Examples of outward codes include "L1", "W1A", "RH1", "RH10" or "SE1P".',
            },
            {
                "value": "incode",
                "label": "Inward Code",
                "description": 'The inward part is the part of the postcode after the single space in the middle. It is three characters long. The inward code assists in the delivery of post within a postal district. Examples of inward codes include "0NY", "7GZ", "7HF", or "8JQ".',
            },
            {
                "value": "quality",
                "label": "Positional Quality",
                "description": "Shows the status of the assigned grid reference.   1 = within the building of the matched address closest to the postcode mean   2 = as for status value 1, except by visual inspection of Landline maps (Scotland only)  3 = approximate to within 50m  4 = postcode unit mean (mean of matched addresses with the same postcode, but not snapped to a building)   5 = imputed by ONS, by reference to surrounding postcode grid references  6 = postcode sector mean, (mainly | PO Boxes)  8 = postcode terminated prior to Gridlink® initiative, last known ONS postcode grid reference1  9 = no grid reference available",
            },
            {
                "value": "eastings",
                "label": "Eastings",
                "description": "The Ordnance Survey postcode grid reference Easting to 1 metre resolution. Grid references for postcodes in Northern Ireland relate to the Irish Grid system. May be null if geolocation not available.",
            },
            {
                "value": "northings",
                "label": "Northings",
                "description": "The Ordnance Survey postcode grid reference Northing to 1 metre resolution. Grid references for postcodes in Northern Ireland relate to the Irish Grid system. May be null if geolocation not available.",
            },
            {
                "value": "longitude",
                "label": "Longitude",
                "description": "The WGS84 longitude given the Postcode's national grid reference. May be null if geolocation not available.",
            },
            {
                "value": "latitude",
                "label": "Latitude",
                "description": "The WGS84 latitude given the Postcode's national grid reference. May be null if geolocation not available.",
            },
            {
                "value": "european_electoral_region",
                "label": "European Electoral Region (EER)",
                "description": "The European Electoral Region code for each postcode.",
            },
            {
                "value": "lsoa",
                "label": "2011 Census lower layer super output area (LSOA)",
                "description": "The 2011 Census lower layer SOA code for England and Wales, SOA code for Northern Ireland and data zone code for Scotland.",
            },
            {
                "value": "msoa",
                "label": "2011 Census middle layer super output area (MSOA)",
                "description": "The 2011 Census middle layer SOA (MSOA) code for England and Wales and intermediate zone for Scotland.",
            },
            {
                "value": "nuts",
                "label": "International Terratorial Levels (ITL) (Former Nomenclature of Units for Territorial Statistics (NUTS)",
                "description": "The national LAU1-equivalent code for each postcode. Pseudo codes are included for Channel Islands and Isle of Man. The field will otherwise be blank for postcodes with no grid reference.   As of May 2021. NUTS has changed to International Territorial Levels (ITL). Postcodes.io will report ITL in nuts and codes.nuts to preserve backwards compatibility.   Following the UK’s withdrawal from the EU, a new UK-managed international statistical geography - ITL (International Territorial Levels) - was introduced from 1st January 2021, replacing the former NUTS classification. They align with international standards, enabling comparability both over time and internationally. To ensure continued alignment, the ITLs mirror the NUTS system. They also follow a similar review timetable – every three years.   NUTS is a hierarchical classification of spatial units that provides a breakdown of the European Union’s territory for producing regional statistics that are comparable across the Union.   The ITL area classification in the UK comprises current national administrative and electoral areas, except in Scotland where some ITL areas comprise whole and/or part Local Enterprise Regions.   The ONSPD contains the LAU1 code (9-character LAD/UA code for England, Wales and Northern Ireland and 'S30' code for Scotland). A comprehensive lookup of LAU and ITL codes is included with the accompanying metadata.",
            },
            {
                "value": "codes",
                "label": "Returns an ID or Code associated with the postcode",
                "description": "Typically, these are a 9 character code known as an ONS Code or GSS Code. This is currently only available for districts, parishes, counties, CCGs, NUTS and wards.",
            },
            {
                "value": "codes.admin_district",
                "description": "See description of admin_district field.",
            },
            {
                "value": "codes.admin_county",
                "description": "See description of admin_county field.",
            },
            {
                "value": "codes.admin_ward",
                "description": "See description of admin_ward field.",
            },
            {
                "value": "codes.parish",
                "description": "See description of parish field.",
            },
            {
                "value": "codes.ccg",
                "description": "See description of ccg field.",
            },
            {
                "value": "codes.ccg_code",
                "description": 'CCG Short Code. e.g. "07N".',
            },
            {
                "value": "codes.nuts",
                "description": "The ITL code associated with the postcode.",
            },
            {
                "value": "codes.lau2",
                "description": "The LAU2 code associated with the postcode.",
            },
            {
                "value": "codes.lsoa",
                "description": "See description of lsoa field.",
            },
            {
                "value": "codes.msoa",
                "description": "See description of msoa field.",
            },
            {
                "value": "codes.parliamentary_constituency",
                "description": "See description of parliamentary_constituency field.",
            },
            {
                "value": "codes.parliamentary_constituency_2025",
                "description": "See description of parliamentary_constituency_2025 field.",
            },
            {
                "value": "codes.ward",
                "description": "The ward code for the postcode.",
            },
        ],
    },
    "electoral_commission_postcode_lookup": {
        "builtin": True,
        "slug": "electoral_commission_postcode_lookup",
        "name": "Electoral Commission Postcode Lookup",
        "description": "Adds UK election and polling station data.",
        "description_url": "https://api.electoralcommission.org.uk/docs/",
        "author": "Democracy Club on behalf of the Electoral Commission",
        "async_postcode_request": electoral_commision_postcode_lookup,
        "source_paths": [
            {"value": "dates[0].ballots[0].ballot_title", "label": "Next Election"},
            {"value": "dates[0].date", "label": "Next Polling Date"},
            {
                "value": "dates[0].polling_station.station.properties.address",
                "label": "Nearest Polling Station Address",
            },
            {
                "value": "dates[0].polling_station.station.properties.postcode",
                "label": "Nearest Polling Station Postcode",
            },
            {
                "value": "dates[0].polling_station.station.id",
                "label": "Nearest Polling Station ID",
            },
            {
                "value": "address_picker",
                "label": "Address Picker",
                "description": "True if we need to show this user an address picker, as their postcode has more than one polling station",
            },
        ],
    },
}
