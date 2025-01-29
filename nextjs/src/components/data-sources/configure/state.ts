import { atomWithMachine } from 'jotai-xstate'
import { createMachine } from 'xstate'

export enum SetupStep {
  Ingest = 'Ingest',
  Metadata = 'Metadata',
  Geocoding = 'Geocoding',
  Mapping = 'Mapping',
  Review = 'Review',
}

export const createConfigureDataSourceStateMachine = () =>
  createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QGMD2A7AZgSygVwCcwARAQwBdSBlVQ5MAOgEl0ZZyBidMAD3IG0ADAF1EoAA6pY2ctgxiQPRAEYAnMoYAWAGzblmgKwHNmgEwB2fdoA0IAJ6IAHAGZnWx6uenTB1avMGps4AvsG2aFi4hCQU1LQE9MyscJwsbAIiCpLSsvJIioiGDK6qjgaCpoJl2s7a5rYOCC4GDMaayqaqdVWCaqHhGDj4RGSUNHSMaSkcALJglBCxQqL52TJy6ApKCGoaOnqGbRZWDU4uxfqOmo6Czubm2mb9IBFD0aNxE0npHADiYKg0BBsKxllkpOs8qBtrstLp9EYTMcdKcds4NJdNM5HKZtAY9Pjnq8oiNYuMEpNkuxZqRxOIQVAwasIblNvkYeo4QdEWZLCj7Cobgx-M4undbtoLAYQmEXoMSTExvFElNqQAlMAAN2wYAA7kyJCyNlsVJz9gijnybAKmhovJ0OjiHhLtET5cNFZ8KQw5gtYhwAEakZAAawNIDWrJNCCCLTUgkEfi88fUmlRnjc+lu5mcmgC9xqbsiHo+5MSvtIi0oXF4GRWhpyxvZiAMykEwvujnMCeM+iCqPa7fMfmuqeUNVUeaLb1JSq+FarpA4qrr4MbUIKMdMmmFk5u5kcHnR2IMqIPbl0d384+U5k0gk004VpeVjAX-vflHDkab0MQzlbBgOmUNtfHKXETFPG0u1MBhBDqQ9LC7B8DEcJ8SzJV8fXmSt-X+QFUGBUFMmZdc2T-BBW3bfwD27QRezMZx028BgAgg29tGvED0PeTD5xwxcaTpBlvyNDdtiojtaJ7dpGNRTj23hSVu0qKoTB42cvXLAT-Q1bU9VEsjo0kmjkPo2T+xtZxemKRw6gg7wagAjTPTLRh8KBBlA2DMMSIbSFyM3MpHGKPwc1ce9VB8UxUTbLEgLxe8TEQ28XJfL4PMIrzuD4QyAujOyNF0YcAlcIxULPTkSi7VR6MEbtWzSvjvUyoioGXKlV1I-Lmyaa4GEqEx2lqlwmJtBEd28KLlBuFw70sJq5xagFPNYWYdK-PyIzEwLthxHc81FAI7OMCp6nGxNYL8S6-FxcxOkWrT3JWrK1takStp-cTEBHYprPu2rtBcS6z3RBggaCIJEvvXxHrchh3rWmZaXpYj622ozeuBgauweQH2jKc7GkeDQ7NcM7al0Tw4awxH2r0nV9U+nboxA1xhWqA8DHC9EzzMODVDAkDLGHKoafnFGvKDUM8qjLH9HB-Nh3xLwuyg4nOSBw9TEcW8dF10xxe9ZHhLWnKuv8uWKN1nc6m55Wah1gJUWMWDTA6HwZu0eDDEfWViQwpby0ltaV1l39NzaVp4OlII-Bm-lGmUVw3F1x4jFqPN2kN-33V4oO3xD9rP1IcPvsoypWOdS98R8Z2bUedsXD0XpUMqe6-YGYt86en0i7+F62rL3anAVu37kFx21b5jRWyxaU9FxTwc67mdXKwk3UeLovh+jXRFNVtQjHUR55NqOCH3o0VE27IGjeD036a1Rnd-l22lcn1X68aXxYOze4AYnTvPfRgDM9TeRlszTGFFhbmFYomR2AEEF2XTCBVigQSZ40sNxXO3dNLwzAbqDq6RX4wPHHAueuZEwzTuLmWK3NbbDVmmdaUICGCEPWn6Ta6Mvojx2PoNw54uzXACCYPQsV3ZuHvLUKK6ccyBDYRwumpDNxszcKUfEXMebKEqhoaaeZ96lAqKoRRz9wGbw+jwlmvUQKaFUK0fwuh9xmE6DFG0ZgNDDj3GOCcU5cFr3St6DhhCVEwgAhee8NQegAUFurFQ5Q4HKGMCrSUST1DmFCLKdAhE4AKADj3Nya4eoUQALSwX3vofwqZaiuDcY0EpLQ-BNOac04cbCVxFKtpuPMqIPDthkXiKih59BsJLp0iO2wAKwQPB0aUvR06OGYtoBgR5s6SnKNzEx-jnzNUSHTcZ5c-CNJGshACWczx2WjgeOxl12htO2YHXuFjWAHL4boN2UUaIYK-vJWqKzOibNzPcGaWzV47ILuwsxupXmswAi0ay9U7IoVbN-eJegOYJj6b4b2tRMnBCAA */
    id: 'configureDataSource',
    context: {},
    initial: SetupStep.Ingest,
    states: {
      [SetupStep.Ingest]: {
        on: {
          next: SetupStep.Metadata,
          [SetupStep.Ingest]: SetupStep.Ingest,
          [SetupStep.Metadata]: SetupStep.Metadata,
          [SetupStep.Geocoding]: SetupStep.Geocoding,
          [SetupStep.Mapping]: SetupStep.Mapping,
          [SetupStep.Review]: SetupStep.Review,
        },
      },
      [SetupStep.Metadata]: {
        on: {
          back: SetupStep.Ingest,
          next: SetupStep.Geocoding,
          [SetupStep.Ingest]: SetupStep.Ingest,
          [SetupStep.Metadata]: SetupStep.Metadata,
          [SetupStep.Geocoding]: SetupStep.Geocoding,
          [SetupStep.Mapping]: SetupStep.Mapping,
          [SetupStep.Review]: SetupStep.Review,
        },
      },
      [SetupStep.Geocoding]: {
        on: {
          back: SetupStep.Metadata,
          next: SetupStep.Mapping,
          [SetupStep.Ingest]: SetupStep.Ingest,
          [SetupStep.Metadata]: SetupStep.Metadata,
          [SetupStep.Geocoding]: SetupStep.Geocoding,
          [SetupStep.Mapping]: SetupStep.Mapping,
          [SetupStep.Review]: SetupStep.Review,
        },
      },
      [SetupStep.Mapping]: {
        on: {
          back: SetupStep.Geocoding,
          next: SetupStep.Review,
          [SetupStep.Ingest]: SetupStep.Ingest,
          [SetupStep.Metadata]: SetupStep.Metadata,
          [SetupStep.Geocoding]: SetupStep.Geocoding,
          [SetupStep.Mapping]: SetupStep.Mapping,
          [SetupStep.Review]: SetupStep.Review,
        },
      },
      [SetupStep.Review]: {
        on: {
          back: SetupStep.Mapping,
          [SetupStep.Ingest]: SetupStep.Ingest,
          [SetupStep.Metadata]: SetupStep.Metadata,
          [SetupStep.Geocoding]: SetupStep.Geocoding,
          [SetupStep.Mapping]: SetupStep.Mapping,
          [SetupStep.Review]: SetupStep.Review,
        },
      },
    },
  })

export const configureDataSourceStateAtom = atomWithMachine(() =>
  createConfigureDataSourceStateMachine()
)
