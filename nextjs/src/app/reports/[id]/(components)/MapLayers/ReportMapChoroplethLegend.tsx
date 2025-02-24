import {
  AggregationOp,
  AreaQueryMode,
  StatisticsConfig,
} from '@/__generated__/graphql'
import { CRMSelection } from '@/components/CRMButtonItem'
import { PopOutChoroplethStatisticalQueryEditor } from '@/components/report/PopOutChoroplethStatisticalQueryEditor'
import { useStatisticalVariables } from '@/components/report/statisticalVariables'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { IconToggle } from '@/components/ui/icon-toggle'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { contentEditableMutation } from '@/lib/html'
import { useActiveTileset, useLoadedMap } from '@/lib/map'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { BorderSolidIcon, ReloadIcon } from '@radix-ui/react-icons'
import clsx from 'clsx'
import { format } from 'd3-format'
import { scaleLinear, scaleSequential } from 'd3-scale'
import { produce } from 'immer'
import { useAtomValue } from 'jotai'
import keyboardKey from 'keyboard-key'
import { max } from 'lodash'
import {
  AlertOctagonIcon,
  CameraIcon,
  HashIcon,
  LucideBoxSelect,
  LucideChevronDown,
  LucideEye,
  LucideEyeOff,
  LucideType,
  Radical,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import toSpaceCase from 'to-space-case'
import { v4 } from 'uuid'
import { BoundaryType, POLITICAL_BOUNDARIES } from '../../politicalTilesets'
import {
  Palette,
  StatisticalDataType,
  StatisticsMode,
  ViewType,
  getReportInterpolatorFromPalette,
} from '../../reportContext'
import useDataByBoundary, {
  choroplethErrorsAtom,
} from '../../useDataByBoundary'
import { EditorField, EditorFieldProps } from '../EditorField'
import { EditorSelect } from '../EditorSelect'
import { EditorSwitch } from '../EditorSwitch'
import { DEFAULT_MARKER_COLOUR } from '../MembersListPointMarkers'

export default function ReportMapChoroplethLegend() {
  const reportManager = useReport()
  const viewManager = useView(ViewType.Map)
  const map = useLoadedMap()
  const [legendOpen, setLegendOpen] = useState(true)
  const [lastFormula, setLastFormula] = useState<null | string>(null)
  const [lastField, setLastField] = useState<null | string>(null)

  const boundaryHierarchy = POLITICAL_BOUNDARIES.find(
    (b) =>
      b.boundaryType ===
      viewManager.currentViewOfType?.mapOptions?.choropleth.boundaryType
  )

  const activeTileset = useActiveTileset(
    viewManager.currentViewOfType?.mapOptions.choropleth.boundaryType
  )

  const {
    refetch: refetchChoropleth,
    loading,
    variables,
  } = useDataByBoundary({
    view: viewManager.currentViewOfType,
    tileset: activeTileset,
  })

  const choroplethLayer = reportManager.report.layers.find((l) =>
    variables?.config.sourceIds?.includes(l.source)
  )

  const statisticalVariables = useStatisticalVariables(
    viewManager.currentViewOfType?.mapOptions.choropleth
      .advancedStatisticsConfig
  )

  if (!viewManager.currentViewOfType) {
    return null
  }

  const mode = viewManager.currentViewOfType?.mapOptions.choropleth.mode

  function downloadScreenshot() {
    map.downloadScreenshot(
      `mapped-${reportManager.report.name}-${viewManager.currentView.name}-${new Date().toISOString()}.png`
    )
  }

  return (
    <div className={`p-4 absolute top-12 transition-all duration-300 left-0`}>
      <Collapsible
        open={legendOpen}
        onOpenChange={setLegendOpen}
        className={clsx(
          ' bg-[#1f2229]/90 text-white rounded-md shadow-lg flex flex-col border border-meepGray-600 backdrop-blur-[5px] ',
          'w-72'
        )}
      >
        <CollapsibleTrigger className="font-medium flex gap-2 text-white hover:text-meepGray-200 justify-between border-meepGray-600 px-4 py-3 items-center transition-all duration-300">
          <b>Legend</b>
          <LucideChevronDown
            className={clsx(
              'w-5 h-5  transition-all duration-300',
              legendOpen ? 'rotate-180' : ''
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="CollapsibleContent divide-y divide-meepGray-600">
          <header className="px-4 pb-3 space-y-2">
            <div
              {...contentEditableMutation((text) => {
                viewManager.updateView((draft) => {
                  draft.description = text
                })
              }, '')}
              className={twMerge(
                'text-sm',
                viewManager.currentViewOfType.description
                  ? 'text-meepGray-200'
                  : 'text-meepGray-400'
              )}
            >
              {viewManager.currentViewOfType.description ||
                'Add a description for this view...'}
            </div>

            <Button
              onClick={downloadScreenshot}
              size="sm"
              className="flex flex-row gap-1 h-auto py-1 text-meepGray-400"
              variant={'outline'}
            >
              <CameraIcon className="w-4 h-4" /> Screenshot map
            </Button>
          </header>

          {Object.values(viewManager.currentViewOfType?.mapOptions.layers).map(
            (l) => (
              <section key={l.id}>
                <MapToggleField
                  className="px-4 py-3"
                  iconComponent={({ className }: { className?: string }) => {
                    return (
                      <div
                        className={twMerge(
                          'w-3 h-3 rounded-full shrink-0 grow-0',
                          l.visible ? 'opacity-100' : 'opacity-75',
                          className
                        )}
                        style={{
                          backgroundColor: l.colour || DEFAULT_MARKER_COLOUR,
                        }}
                      />
                    )
                  }}
                  label={l.name || reportManager.getLayer(l.layerId)?.name}
                  labelClassName={twMerge(
                    'w-full font-medium',
                    l.visible ? 'text-white' : 'text-meepGray-400'
                  )}
                  value={l.visible}
                  onChange={(display) => {
                    viewManager.updateView((draft) => {
                      draft.mapOptions.layers[l.id].visible = !!display
                    })
                  }}
                />
              </section>
            )
          )}

          <section className={'flex flex-col gap-2 px-4 py-3'}>
            <p
              className={twMerge(
                'text-sm font-medium flex flex-row items-center justify-between gap-2',
                viewManager.currentViewOfType?.mapOptions.display.choropleth
                  ? 'text-white'
                  : 'text-meepGray-400'
              )}
            >
              Map shading
              <Button
                onClick={() => refetchChoropleth()}
                variant="ghost"
                className="p-0 bg-transparent ml-auto hover:bg-transparent group h-1"
                disabled={loading}
              >
                <ReloadIcon className="w-4 h-4 text-meepGray-400 group-hover:text-meepGray-200" />
              </Button>
              <MapToggle
                onChange={() => {
                  viewManager.updateView((draft) => {
                    draft.mapOptions.display.choropleth =
                      !draft.mapOptions.display.choropleth
                  })
                }}
                value={
                  !!viewManager.currentViewOfType?.mapOptions.display.choropleth
                }
              />
            </p>

            {viewManager.currentViewOfType?.mapOptions.display.choropleth && (
              <>
                {/* Advanced and hide */}
                <div className="flex flex-col gap-2 w-full">
                  <EditorSelect
                    value={
                      viewManager.currentViewOfType?.mapOptions.choropleth
                        .advancedStatisticsConfig?.sourceIds?.[0]
                    }
                    className={'w-full'}
                    options={reportManager.report.layers.map((layer) => ({
                      value: layer.source,
                      label: (
                        <CRMSelection
                          source={layer.sourceData}
                          displayCount={false}
                          className="truncate"
                        />
                      ),
                    }))}
                    onChange={(sourceId) =>
                      viewManager.updateView((draft) => {
                        draft.mapOptions.choropleth.advancedStatisticsConfig.sourceIds =
                          [sourceId]
                      })
                    }
                    valueClassName={twMerge(
                      !viewManager.currentViewOfType?.mapOptions.display
                        .choropleth
                        ? '!text-meepGray-500'
                        : ''
                    )}
                  />
                </div>

                {viewManager.currentViewOfType?.mapOptions.choropleth
                  .dataType !== StatisticalDataType.Nominal && (
                  <>
                    <EditorSelect
                      // iconComponent={LucidePaintRoller}
                      // label={'Displaying'}
                      labelClassName="w-[100px]"
                      value={
                        viewManager.currentViewOfType?.mapOptions.choropleth
                          .palette
                      }
                      valueClassName="w-full"
                      options={Object.values(Palette).map((value) => ({
                        value,
                        label: (
                          <ColourStops
                            key={value}
                            palette={value}
                            reversePalette={
                              viewManager.currentViewOfType?.mapOptions
                                .choropleth.isPaletteReversed
                            }
                          />
                        ),
                      }))}
                      onChange={(option) => {
                        viewManager.updateView((draft) => {
                          draft.mapOptions.choropleth.palette =
                            option as Palette
                        })
                      }}
                    />

                    <EditorSwitch
                      label="Reverse palette"
                      value={
                        viewManager.currentViewOfType?.mapOptions.choropleth
                          .isPaletteReversed
                      }
                      onChange={(bool) => {
                        viewManager.updateView((draft) => {
                          draft.mapOptions.choropleth.isPaletteReversed = !!bool
                        })
                      }}
                    />
                  </>
                )}

                <EditorSelect
                  // iconComponent={LucidePaintRoller}
                  label={'Displaying'}
                  labelClassName="w-[100px]"
                  value={mode}
                  options={Object.values(StatisticsMode).map((value) => ({
                    value,
                    label: toSpaceCase(value),
                  }))}
                  onChange={(option) => {
                    viewManager.updateView((draft) => {
                      draft.mapOptions.choropleth.mode =
                        option as StatisticsMode

                      if (option !== StatisticsMode.Advanced) {
                        // reset: dataType / isElectoral / displayRawField / fieldIsPercentage
                        draft.mapOptions.choropleth.dataType =
                          StatisticalDataType.Continuous
                        draft.mapOptions.choropleth.isElectoral = false
                        draft.mapOptions.choropleth.displayRawField = false
                        draft.mapOptions.choropleth.fieldIsPercentage = false
                        delete draft.mapOptions.choropleth.field
                      }

                      if (option === StatisticsMode.Count) {
                        draft.mapOptions.choropleth.advancedStatisticsConfig = {
                          sourceIds:
                            draft.mapOptions.choropleth.advancedStatisticsConfig
                              .sourceIds,
                          aggregationOperation: AggregationOp.Count,
                          areaQueryMode: AreaQueryMode.Overlapping,
                        }
                      }

                      if (option === StatisticsMode.Field) {
                        // Pick the first available
                        draft.mapOptions.choropleth.field =
                          draft.mapOptions.choropleth.field ||
                          lastField ||
                          statisticalVariables.dataSourceFields?.[0]
                        // Simple mode
                        draft.mapOptions.choropleth.advancedStatisticsConfig = {
                          sourceIds:
                            draft.mapOptions.choropleth.advancedStatisticsConfig
                              .sourceIds,
                          areaQueryMode: AreaQueryMode.Overlapping,
                        }
                      }

                      if (option === StatisticsMode.Formula) {
                        draft.mapOptions.choropleth.field = 'simple_formula'
                        // Simple mode
                        draft.mapOptions.choropleth.advancedStatisticsConfig = {
                          sourceIds:
                            draft.mapOptions.choropleth.advancedStatisticsConfig
                              .sourceIds,
                          areaQueryMode: AreaQueryMode.Overlapping,
                          calculatedColumns:
                            // If possible salvage an existing formula
                            draft.mapOptions.choropleth.advancedStatisticsConfig.calculatedColumns?.slice(
                              0,
                              1
                            ) || [
                              // Or else create a new one
                              {
                                id: v4(),
                                name: 'simple_formula',
                                expression:
                                  lastFormula ||
                                  `\`${statisticalVariables.dataSourceFields?.[0]}\``,
                              },
                            ],
                        }
                        if (
                          draft.mapOptions.choropleth.advancedStatisticsConfig
                            .calculatedColumns?.[0]
                        ) {
                          draft.mapOptions.choropleth.advancedStatisticsConfig.calculatedColumns[0].name =
                            'simple_formula'
                        }
                      }
                    })
                  }}
                />

                {viewManager.currentViewOfType?.mapOptions.choropleth.mode ===
                  StatisticsMode.Formula && (
                  <FormulaConfig
                    config={
                      viewManager.currentViewOfType?.mapOptions.choropleth
                        .advancedStatisticsConfig
                    }
                    initialFormula={
                      viewManager.currentViewOfType?.mapOptions.choropleth
                        .advancedStatisticsConfig.calculatedColumns?.[0]
                        ?.expression || ''
                    }
                    onSave={(formula) => {
                      setLastFormula(formula)
                      viewManager.updateView((draft) => {
                        draft.mapOptions.choropleth.advancedStatisticsConfig.calculatedColumns =
                          [{ name: 'simple_formula', expression: formula }]
                      })
                    }}
                  />
                )}

                {viewManager.currentViewOfType?.mapOptions.choropleth.mode ===
                  StatisticsMode.Field && (
                  <EditorSelect
                    label="Displayed field"
                    labelClassName="w-[100px]"
                    value={
                      viewManager.currentViewOfType?.mapOptions.choropleth.field
                    }
                    options={Object.entries(statisticalVariables)
                      .filter(([key, _]) => key !== 'all')
                      .map(([key, value]) => ({
                        label: toSpaceCase(key),
                        options: value.map((value) => ({
                          value: value,
                          label: value,
                        })),
                      }))}
                    onChange={(dataSourceField) => {
                      setLastField(dataSourceField)
                      viewManager.updateView((draft) => {
                        draft.mapOptions.choropleth.field = dataSourceField
                      })
                    }}
                    disabled={!choroplethLayer?.sourceData.fieldDefinitions}
                  />
                )}

                {viewManager.currentViewOfType?.mapOptions.choropleth.mode ===
                  StatisticsMode.Advanced && (
                  <PopOutChoroplethStatisticalQueryEditor
                    value={
                      viewManager.currentViewOfType?.mapOptions.choropleth
                        .advancedStatisticsConfig
                    }
                    onChange={(producer) => {
                      viewManager.updateView((draft) => {
                        draft.mapOptions.choropleth.advancedStatisticsConfig =
                          produce(
                            draft.mapOptions.choropleth
                              .advancedStatisticsConfig,
                            producer
                          )
                      })
                    }}
                  />
                )}
              </>
            )}
          </section>

          <section className="flex flex-col gap-2 px-4 py-3">
            <p className="text-sm font-medium flex flex-row justify-between items-center">
              Political boundaries
            </p>

            <EditorSelect
              iconComponent={LucideBoxSelect}
              // label={'Boundaries'}
              labelClassName="w-auto"
              value={
                viewManager.currentViewOfType?.mapOptions?.choropleth
                  .boundaryType
              }
              options={POLITICAL_BOUNDARIES.map((boundary) => ({
                label: boundary.label,
                value: boundary.boundaryType,
              }))}
              onChange={(d) => {
                viewManager.updateView((draft) => {
                  draft.mapOptions.choropleth.boundaryType = d as BoundaryType
                })
              }}
            />

            {(boundaryHierarchy?.tilesets?.length || 0) > 1 &&
              boundaryHierarchy?.tilesets.map((tileset) => (
                <MapToggleField
                  className="ml-4"
                  key={tileset.labelId}
                  label={
                    <>
                      {tileset.name}
                      {/* {viewManager.currentViewOfType?.mapOptions.choropleth
                        .lockedOnAnalyticalAreaType ===
                      tileset.analyticalAreaType ? (
                        <div className="font-mono uppercase text-xs text-meepGray-400 flex flex-row gap-1">
                          <LucideLock className="w-3 h-3 text-meepGray-400" />{' '}
                          <span>Locked on</span>
                        </div>
                      ) : undefined} */}
                    </>
                  }
                  labelClassName="w-full"
                  value={
                    tileset.analyticalAreaType ===
                    activeTileset.analyticalAreaType
                    // viewManager.currentViewOfType?.mapOptions.choropleth
                    //   .lockedOnAnalyticalAreaType
                    //   ? viewManager.currentViewOfType?.mapOptions.choropleth
                    //       .lockedOnAnalyticalAreaType ===
                    //     tileset.analyticalAreaType
                    //   : tileset.analyticalAreaType ===
                    //     activeTileset.analyticalAreaType
                  }
                  onChange={(bool) => {
                    // viewManager.updateView((draft) => {
                    //   if (
                    //     draft.mapOptions.choropleth
                    //       .lockedOnAnalyticalAreaType ===
                    //     tileset.analyticalAreaType
                    //   ) {
                    //     // unset it
                    //     delete draft.mapOptions.choropleth
                    //       .lockedOnAnalyticalAreaType
                    //   } else {
                    //     // set it
                    //     draft.mapOptions.choropleth.lockedOnAnalyticalAreaType =
                    //       tileset.analyticalAreaType
                    //   }
                    // })
                  }}
                />
              ))}

            <MapToggleField
              iconComponent={LucideType}
              label="Place labels"
              value={
                viewManager.currentViewOfType?.mapOptions?.display.boundaryNames
              }
              onChange={(showBoundaryNames) => {
                viewManager.updateView((draft) => {
                  draft.mapOptions.display.boundaryNames = !!showBoundaryNames
                })
              }}
            />

            {viewManager.currentViewOfType?.mapOptions?.display.choropleth &&
              viewManager.currentViewOfType?.mapOptions?.display
                .boundaryNames && (
                <EditorSwitch
                  iconComponent={LucideType}
                  label="... when no data"
                  className="ml-2"
                  value={
                    viewManager.currentViewOfType?.mapOptions?.display
                      .labelsForAllAreas
                  }
                  onChange={(labelsForAllAreas) => {
                    viewManager.updateView((draft) => {
                      draft.mapOptions.display.labelsForAllAreas =
                        labelsForAllAreas
                    })
                  }}
                />
              )}

            {viewManager.currentViewOfType?.mapOptions?.display.choropleth && (
              <MapToggleField
                iconComponent={HashIcon}
                label="Value labels"
                value={
                  viewManager.currentViewOfType?.mapOptions?.display
                    .choroplethValueLabels
                }
                onChange={(choroplethValueLabels) => {
                  viewManager.updateView((draft) => {
                    draft.mapOptions.display.choroplethValueLabels =
                      !!choroplethValueLabels
                  })
                }}
              />
            )}

            <MapToggleField
              iconComponent={BorderSolidIcon}
              label="Borders"
              value={viewManager.currentViewOfType?.mapOptions?.display.borders}
              onChange={(bool) => {
                viewManager.updateView((draft) => {
                  draft.mapOptions.display.borders = !!bool
                })
              }}
            />
          </section>

          {/* <section className="flex flex-col gap-2 px-4 py-3">
            <p className="text-sm font-medium">Base map layers</p>

            <MapToggleField
              iconComponent={LucideMap}
              label={'Street details'}
              labelClassName="text-white"
              value={
                viewManager.currentViewOfType?.mapOptions?.display.streetDetails
              }
              onChange={(showStreetDetails) => {
                viewManager.updateView((draft) => {
                  draft.mapOptions.display.streetDetails = showStreetDetails
                })
              }}
            />
          </section> */}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function MapToggleField({
  value,
  onChange,
  ...props
}: EditorFieldProps & MapToggleProps) {
  return (
    <EditorField
      {...props}
      className={twMerge(
        'h-auto',
        value ? 'text-meepGray-200' : 'text-meepGray-400',
        props.className
      )}
      onClick={() => onChange(!value)}
      labelClassName={twMerge(
        'w-[100px] truncate',
        value ? 'text-meepGray-200' : 'text-meepGray-400',
        props.labelClassName
      )}
      iconClassName={twMerge(
        value ? 'text-meepGray-200' : 'text-meepGray-400',
        props.iconClassName
      )}
    >
      <div className="ml-auto h-auto items-center flex flex-row">
        <MapToggle value={value} onChange={onChange} />
      </div>
    </EditorField>
  )
}

interface MapToggleProps {
  value?: boolean
  onChange: (value?: boolean) => void
}

function MapToggle({ value, onChange }: MapToggleProps) {
  return (
    <IconToggle
      className="p-0 bg-transparent group h-auto"
      on={
        <LucideEye className="w-4 h-4 text-meepGray-400 group-hover:text-meepGray-200" />
      }
      off={<LucideEyeOff className="w-4 h-4 text-meepGray-500" />}
      onChange={() => {
        onChange(!value)
      }}
      value={value}
    />
  )
}

export function ColourStops({
  palette,
  reversePalette,
}: {
  palette: Palette
  reversePalette?: boolean
}) {
  const viewManager = useView(ViewType.Map)

  const activeTileset = useActiveTileset(
    viewManager.currentViewOfType?.mapOptions.choropleth.boundaryType
  )

  const { loading, data } = useDataByBoundary({
    view: viewManager.currentViewOfType,
    tileset: activeTileset,
  })

  const dataByBoundary = data?.statisticsForChoropleth || []

  // Get min and max counts
  let minCount = 0 // min(dataByBoundary.map((d) => d.count || 0)) || 0
  let maxCount = max(dataByBoundary.map((d) => d.count || 0)) || 1

  //
  const difference = maxCount - minCount
  let isPercentage = false
  let formatStr = ',.2r'
  if (difference < 2) {
    formatStr = '.0%'
    isPercentage = true
  }

  // ensure minCount and maxCount are different
  if (minCount === maxCount) {
    if (minCount >= 1) {
      minCount = minCount - 0.1
    } else {
      maxCount = maxCount + 0.1
    }
  }

  const interpolator = getReportInterpolatorFromPalette(palette, reversePalette)

  // Legend scale
  const colourScale = scaleSequential()
    .domain([minCount, maxCount])
    .interpolator(interpolator)

  // Define 30 stops of colour
  let steps = isPercentage ? 5 : 7

  // Now turn each i into an associated number in the range min-max:
  const stepsToDomainTransformer = scaleLinear()
    .domain([0, steps])
    .range([minCount, maxCount])

  const colourStops = new Array(steps).fill(0).map((_, step) => {
    const count = stepsToDomainTransformer(step)
    return [count, colourScale(count)] as [number, string]
  })

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="flex flex-row items-center py-1 w-full">
        {colourStops.map((stop, i) => {
          return (
            <div
              key={i}
              className="basis-0 min-w-0 flex-shrink-0 grow flex flex-col"
            >
              <div
                className="h-4"
                style={{
                  backgroundColor: String(stop[1]),
                }}
              ></div>
              <div className="text-xs text-center px-2">
                {format(formatStr)(Number(stop[0]))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FormulaConfig({
  initialFormula,
  onSave,
  config,
}: {
  initialFormula: string
  onSave: (formula: string) => void
  config: StatisticsConfig
}) {
  const viewManager = useView(ViewType.Map)
  const choroplethErrors = useAtomValue(choroplethErrorsAtom)
  const [inputText, setInputText] = useState(initialFormula)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const editingEmpty = !inputText
  const [editing, setEditing] = useState(editingEmpty)
  const statisticalVariables = useStatisticalVariables(config)

  if (!viewManager.currentViewOfType) {
    return null
  }

  function handleVariableClick(variable: string) {
    const text = `\`${variable}\``
    navigator.clipboard.writeText(text)
    toast.success(`Copied '${variable}' to clipboard`)
    if (!!inputRef.current) {
      const str = inputRef.current.value
      const idx = inputRef.current.selectionStart
      const newText = str.slice(0, idx) + text + str.slice(idx)
      setInputText(newText)
      inputRef.current?.focus()
    }
  }

  function handleSaveFormula() {
    if (editing) {
      setEditing(false)
      onSave(inputText)
    } else {
      setEditing(true)
    }
  }

  const choroplethError = choroplethErrors[viewManager.currentViewOfType.id]

  return (
    <div className=" text-xs font-mono text-meepGray-400 w-full flex flex-col gap-2 border-t border-meepGray-600 mt-2">
      <div className="flex items-center gap-1 pt-1">
        <Radical className="w-3 h-3" />
        Custom Formula
        <Separator orientation="vertical" className="ml-2" />
        <div onClick={handleSaveFormula} className="p-1 cursor-pointer ">
          {editing ? (
            <p className="text-xs font-mono text-green-600 hover:text-green-500">
              Save
            </p>
          ) : (
            <p className="text-xs font-mono text-orange-400 hover:text-orange-500">
              Edit
            </p>
          )}
        </div>
      </div>
      <Textarea
        ref={inputRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        onKeyDown={(e) => {
          const key = keyboardKey.getCode(e)
          if (key === keyboardKey.Enter) {
            handleSaveFormula()
          }
        }}
        className="bg-meepGray-800 rounded font-mono text-meepGray-200"
        disabled={!editing}
      />
      {choroplethErrors[viewManager.currentViewOfType.id] && (
        <div className="text-xs text-red-500 font-mono">
          <AlertOctagonIcon className="w-4 h-4 inline-block mr-1" />
          <u>Formula error:</u>{' '}
          {typeof choroplethError === 'string'
            ? choroplethError
            : choroplethError?.message}
        </div>
      )}
      <div className="flex flex-col gap-2 ">
        {editing && (
          <section className="space-y-3">
            <h4 className="text-xs font-mono text-meepGray-400">
              Available variables:
            </h4>
            <pre className="flex flex-row flex-wrap gap-1">
              {statisticalVariables.dataSourceFields?.map((field) => (
                <div
                  key={field}
                  className="bg-meepGray-700 hover:bg-meepGray-500 px-2 py-1 rounded-md text-xs cursor-pointer"
                  onClick={() => handleVariableClick(field)}
                >
                  <span>{field}</span>
                </div>
              ))}
            </pre>
            <h4 className="text-xs font-mono text-meepGray-400">
              Calculated variables:
            </h4>
            <pre className="flex flex-row flex-wrap gap-1">
              {statisticalVariables.calculatedValues.map((field) => (
                <div
                  key={field}
                  className="bg-meepGray-700 hover:bg-meepGray-500 px-2 py-1 rounded-md text-xs cursor-pointer"
                  onClick={() => handleVariableClick(field)}
                >
                  <span>{field}</span>
                </div>
              ))}
            </pre>
          </section>
        )}
      </div>
    </div>
  )
}
