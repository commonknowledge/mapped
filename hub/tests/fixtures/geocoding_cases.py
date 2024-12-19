geocoding_cases = [
    # Name matching; cases that historically didn't work
    {
        "id": "1",
        "council": "Barnsley",
        "ward": "St Helens",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05000993",
    },
    {
        "id": "2",
        "council": "North Lincolnshire",
        "ward": "Brigg & Wolds",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015081",
    },
    {
        "id": "3",
        "council": "Test Valley",
        "ward": "Andover Downlands",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05012085",
    },
    {
        "id": "4",
        "council": "North Warwickshire",
        "ward": "Baddesley and Grendon",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05007461",
    },
    # Name rewriting required
    {
        "id": "5",
        "council": "Herefordshire, County of",
        "ward": "Credenhill",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05012957",
    },
    # GSS code matching
    {
        "id": "999",
        "council": "E08000016",
        "ward": "E05000993",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05000993",
    },
    # Misc
    # Gwynedd		Brithdir and Llanfachreth, Ganllwyd, Llanelltyd
    # is Brithdir and Llanfachreth/Ganllwyd/Llanelltyd in MapIt
    # https://mapit.mysociety.org/area/165898.html
    {
        "id": "6",
        "council": "Gwynedd",
        "ward": "Brithdir and Llanfachreth, Ganllwyd, Llanelltyd",
        "expected_area_type_code": "WD23",  # TODO: actually it's a UTE, which
        "expected_area_gss": "W05001514",
    },
    # Isle of Anglesey		Canolbarth Mon
    # https://mapit.mysociety.org/area/144265.html
    {
        "id": "7",
        "council": "Isle of Anglesey",
        "ward": "Canolbarth Mon",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001496",
    },
    # Denbighshire		Rhyl T┼À Newydd
    # Weird character in the name, probably needs trigram matching or something
    # https://mapit.mysociety.org/area/166232.html
    {
        "id": "8",
        "council": "Denbighshire",
        "ward": "Rhyl T┼À Newydd",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001354",
    },
    # Swansea		B├┤n-y-maen
    # Similarly, weird stuff in name
    # Maybe it's a problem with the encoding?
    # https://mapit.mysociety.org/area/165830.html  — Bon-y-maen
    {
        "id": "9",
        "council": "Swansea",
        "ward": "B├┤n-y-maen",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001040",
    },
    # Gwynedd		Pendraw'r Llan
    # Ought to be Pen draw Llyn
    # https://mapit.mysociety.org/area/166296.html
    {
        "id": "10",
        "council": "Gwynedd",
        "ward": "Pendraw'r Llan",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001556",
    },
    # Gwynedd		Tre-garth a Mynydd Llandyg├íi
    # https://mapit.mysociety.org/area/12219.html
    # Tregarth & Mynydd Llandygai
    {
        "id": "542",
        "council": "Gwynedd",
        "ward": "Tre-garth a Mynydd Llandyg├íi",
        "expected_area_type_code": "WD23",  # TODO: actually a UTE
        "expected_area_gss": "W05001563",
    },
    # A bunch of wards with the same name, should all point to different things
    {
        "id": "11",
        "council": "Sandwell",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05001260",
    },
    {
        "id": "12",
        "council": "Nuneaton and Bedworth",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05007474",
    },
    {
        "id": "13",
        "council": "Redditch",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05007868",
    },
    {
        "id": "14",
        "council": "Shropshire",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05008136",
    },
    {
        "id": "15",
        "council": "Swale",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05009544",
    },
    {
        "id": "16",
        "council": "Leicester",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05010458",
    },
    {
        "id": "17",
        "council": "Cotswold",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05010696",
    },
    {
        "id": "18",
        "council": "Lincoln",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05010784",
    },
    {
        "id": "19",
        "council": "Cambridge",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013050",
    },
    {
        "id": "20",
        "council": "Buckinghamshire",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013120",  # old "E05002674",
    },
    {
        "id": "21",
        "council": "Merton",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013810",
    },
    {
        "id": "22",
        "council": "Reading",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05013864",
        # https://findthatpostcode.uk/areas/E05013864.html
    },
    {
        "id": "23",
        "council": "Barking and Dagenham",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05014053",
    },
    {
        "id": "24",
        "council": "Rushcliffe",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05014965",  # old"E05009708",
    },
    {
        "id": "25",
        "council": "Derby",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015507",
    },
    {
        "id": "26",
        "council": "Dumfries and Galloway",
        "ward": "Abbey",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "S13002884",  # old:"S13002537",
    },
    # Nones
    {
        "id": "27",
        "council": None,
        "ward": None,
        "expected_area_type_code": None,
        "expected_area_gss": None,
    },
    #
    # More geocoding fails
    {
        "id": "28",
        "council": "Wychavon",
        "ward": "Bretforton & Offenham",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015444",
    },
    # East HertfordshireBuntingford
    {
        "id": "29",
        "council": "East Hertfordshire",
        "ward": "Buntingford",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05015362",
    },
    # Neath Port TalbotCadoxton
    {
        "id": "30",
        "council": "Neath Port Talbot",
        "ward": "Cadoxton",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "W05001689",
    },
    # Great YarmouthCentral and Northgate
    {
        "id": "31",
        "council": "Great Yarmouth",
        "ward": "Central and Northgate",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05005788",
    },
    # CarmarthenshirePontyberem
    {
        "id": "32",
        "council": "Carmarthenshire",
        "ward": "Pontyberem",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "W05001219",
    },
    # Geocoding based on historical parent areas
    # that nonetheless point to live child areas
    #
    # RyedaleAmotherby & Ampleforth:
    # This is a case where Ryedale is a now-defunct council
    # but Amotherby & Ampleforth is still a live ward, under a new council.
    # Because the dataset is ultimately about the ward, the geocoding should still work.
    # Code-wise, this means looking for parent areas even when they're defunct
    # if it means finding the right live child area.
    {
        "id": "33",
        "council": "Ryedale",
        "ward": "Amotherby & Ampleforth",
        "expected_area_type_code": "WD23",
        "expected_area_gss": "E05014252",
    },
]
