import GeocodingScreen from './Geocoding'
import IngestScreen from './Ingest'
import MappingScreen from './Mapping'
import MetadataScreen from './Metadata'
import ReviewScreen from './Review'
import { SetupStep } from './state'

export const SOURCE_SETUP_STEPS = [
  {
    key: SetupStep.Ingest,
    label: 'Connect',
    screen: IngestScreen,
  },
  {
    key: SetupStep.Metadata,
    label: 'Basic info',
    screen: MetadataScreen,
  },
  {
    key: SetupStep.Geocoding,
    label: 'Location matching',
    screen: GeocodingScreen,
  },
  {
    key: SetupStep.Mapping,
    label: 'Data tagging',
    screen: MappingScreen,
  },
  {
    key: SetupStep.Review,
    label: 'Review',
    screen: ReviewScreen,
  },
] as const
