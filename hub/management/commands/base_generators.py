from time import sleep

from django.core.management.base import BaseCommand

import pandas as pd
from tqdm import tqdm

from hub.models import Area
from utils.mapit import (
    BadRequestException,
    ForbiddenException,
    InternalServerErrorException,
    MapIt,
    NotFoundException,
    RateLimitException,
)

mapit_types = {
    "LBO": "STC",
    "UTA": "STC",
    "COI": "STC",
    "LGD": "STC",
    "CTY": "STC",
    "MTD": "STC",
    "NMD": "DIS",
    "DIS": "DIS",
    "WMC": "WMC23",
    "WMCF": "WMC23",
}


class BaseLatLonGeneratorCommand(BaseCommand):
    uses_gss = False
    uses_postcodes = False
    out_file = None
    location_col = "lat_lon"
    legacy_col = "area"
    cols = ["WMC", "WMC23", "STC", "DIS"]

    tqdm.pandas()

    def get_dataframe(self):
        df = pd.read_csv(self.data_file)
        df = df.dropna(axis="columns", how="all")

        return df

    def _process_location(self, lat_lon=None, postcode=None, row_name=None):
        lat, lon = None, None
        if lat_lon is not None:
            lat = lat_lon[0]
            lon = lat_lon[1]

        cols = [self.legacy_col, *self.cols]
        if (self.uses_postcodes and not pd.isna(postcode)) or (
            not pd.isna(lat) and not pd.isna(lon)
        ):
            areas = {}
            try:
                mapit = MapIt()
                if self.uses_postcodes:
                    gss_codes = mapit.postcode_point_to_gss_codes_with_type(postcode)
                else:
                    gss_codes = mapit.wgs84_point_to_gss_codes_with_type(lon, lat)

                for area_type, code in gss_codes.items():
                    if mapit_types.get(area_type, None) is not None:
                        if self.uses_gss:
                            areas[mapit_types[area_type]] = code
                        else:
                            area = Area.objects.filter(
                                gss=code, area_type__code=mapit_types[area_type]
                            ).first()
                            areas[mapit_types[area_type]] = area.name
                    else:
                        continue
            except (
                NotFoundException,
                BadRequestException,
                InternalServerErrorException,
                ForbiddenException,
            ) as error:
                location_data = lat_lon
                if self.uses_postcodes:
                    location_data = postcode
                self.stderr.write(
                    f"Error fetching row {row_name} with {location_data}: {error}"
                )
                return pd.Series([None for t in cols], index=cols)
            except RateLimitException as error:
                self.stderr.write(f"Mapit Error - {error}, waiting for a minute")
                sleep(60)
                return False

            areas[self.legacy_col] = areas.get("WMC", None)
            vals = [areas.get(t, None) for t in cols]
            return pd.Series(vals, index=cols)
        else:
            self.stderr.write(f"missing location data for row {row_name}")
            return pd.Series([None for t in cols], index=cols)

    def process_location(self, lat_lon=None, postcode=None, row_name=None):
        success = self._process_location(
            lat_lon=lat_lon, postcode=postcode, row_name=row_name
        )
        # retry once if it fails so we can catch rate limit errors
        if success is False:
            return self._process_location(
                lat_lon=lat_lon, postcode=postcode, row_name=row_name
            )
        else:
            return success

    def get_location_from_row(self, row):
        if self.uses_postcodes:
            return {"postcode": row["postcode"]}
        else:
            return {"lat_lon": [row["lat"], row["lon"]]}

    def process_data(self, df):
        if not self._quiet:
            self.stdout.write("Generating Area details from location values")

        if not self._ignore and self.out_file is not None:
            try:
                # check that we've got all the output we're expecting before using
                # the old values
                old_df = pd.read_csv(self.out_file)
                usecols = list(set(self.cols).intersection(df.columns))
                if len(usecols) == len(self.cols):
                    old_df = pd.read_csv(
                        self.out_file, usecols=[self.lat_lon_row, *self.cols]
                    )
                    location_lookup = {
                        row[self.location_col]: row[self.legacy_col]
                        for index, row in old_df.iterrows()
                    }
                    if not self._quiet:
                        self.stdout.write("Reading codes from existing file")
                    df[self.legacy_col] = df.apply(
                        lambda row: location_lookup.get((row[self.location_col]), None),
                        axis=1,
                    )
            except FileNotFoundError:
                self.stderr.write("No existing file.")

        df = df.join(
            df.progress_apply(
                lambda row: self.process_location(
                    row_name=row[self.row_name], **self.get_location_from_row(row)
                ),
                axis=1,
            )
        )

        return df

    def save_data(self, df):
        df.to_csv(self.out_file, index=False)

    def add_arguments(self, parser):
        parser.add_argument(
            "-q", "--quiet", action="store_true", help="Silence progress bars."
        )
        parser.add_argument(
            "-i", "--ignore", action="store_true", help="Ignore existing data file"
        )

    def _setup(self, *args, **kwargs):
        pass

    def handle(self, quiet=False, ignore=False, *args, **options):
        self._quiet = quiet

        if not self._quiet:
            self.stdout.write(self.message)
        self._ignore = ignore
        self._setup(*args, **options)
        df = self.get_dataframe()
        out_df = self.process_data(df)
        self.save_data(out_df)
