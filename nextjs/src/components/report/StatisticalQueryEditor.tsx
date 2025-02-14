import {
  AggregationOp,
  AnalyticalAreaType,
  AreaQueryMode,
  CalculatedColumn,
  GroupByColumn,
  StatisticsConfig,
} from '@/__generated__/graphql'
import { EditorSelect } from '@/app/reports/[id]/(components)/EditorSelect'
import { EditorSwitch } from '@/app/reports/[id]/(components)/EditorSwitch'
import { EditorTextInput } from '@/app/reports/[id]/(components)/EditorTextInput'
import { ViewType } from '@/app/reports/[id]/reportContext'
import { CRMSelection } from '@/components/CRMButtonItem'
import { Button } from '@/components/ui/button'
import { useReport } from '@/lib/map/useReport'
import { useView } from '@/lib/map/useView'
import { WritableDraft } from 'immer'
import { cloneDeep, isEqual } from 'lodash'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import toSpaceCase from 'to-space-case'
import { v4 } from 'uuid'
import { useStatisticalVariables } from './statisticalVariables'

export function StatisticalQueryEditor({
  value,
  onChange,
  allowGroupByArea = false,
  allowGroupByColumn = false,
}: {
  value: StatisticsConfig
  onChange: (cb: (value: WritableDraft<StatisticsConfig>) => void) => void
  allowGroupByArea?: boolean
  allowGroupByColumn?: boolean
}) {
  const reportManager = useReport()
  const statisticalVariables = useStatisticalVariables(value)
  const [excludeColumnsStr, setExcludeColumnsStr] = useState(
    value.excludeColumns?.join(', ') || ''
  )

  return (
    <>
      {/* # Querying */}
      <section className="space-y-5 p-4">
        <h3 className="text-md font-medium">Querying</h3>
        <EditorSelect
          value={value?.sourceIds?.[0]}
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
            onChange((draft) => {
              draft.sourceIds = [sourceId]
            })
          }
        />
        {/* gss_codes: Optional[List[str]] = None */}
        <EditorSelect
          label={'Fetch data for'}
          value={value?.areaQueryMode}
          options={Object.entries(AreaQueryMode).map(([key, value]) => ({
            value: value,
            label: toSpaceCase(value),
          }))}
          onChange={(value) => {
            onChange((draft) => {
              draft.areaQueryMode = value as AreaQueryMode
            })
          }}
        />
        {/* map_bounds: Optional[stats.MapBounds] = None */}
        {/* Field defs */}

        <EditorSelect
          label="Aggregation operation"
          value={value?.aggregationOperation}
          options={Object.values(AggregationOp).map((value) => ({
            value: value,
            label: toSpaceCase(value),
          }))}
          onChange={(value) =>
            onChange((draft) => {
              draft.aggregationOperation = value as AggregationOp
            })
          }
        />
        {/* aggregation_operations: Optional[List[stats.AggregationDefinition]] = None */}
        {/* return_columns: Optional[List[str]] = None */}
      </section>
      {/* # Grouping */}
      {/* Something for the table view */}
      {/* <section className='p-4'> */}
      {/* <h3 className="text-md font-medium">Grouping</h3> */}
      {/* group_by_area: Optional[AnalyticalAreaType] = None */}
      {/* group_by_columns: Optional[List[stats.GroupByColumn]] = None */}
      {/* </section> */}
      {/* # Values */}
      <section className="space-y-5 p-4">
        <h3 className="text-md font-medium">Pre-group-by calculated columns</h3>
        {/* pre_group_by_calculated_columns: Optional[List[stats.CalculatedColumn]] = None */}
        {value.preGroupByCalculatedColumns?.map((column, index) => (
          <FormulaEditor
            key={column.id}
            column={column}
            onSave={(column) => {
              onChange((draft) => {
                const index = draft.preGroupByCalculatedColumns?.findIndex(
                  (c) => c.id === column.id
                )
                if (index === undefined || index === -1) return
                draft.preGroupByCalculatedColumns![index] = column
              })
            }}
            onDelete={(column) => {
              onChange((draft) => {
                const index = draft.preGroupByCalculatedColumns?.findIndex(
                  (c) => c.id === column.id
                )
                if (index === undefined || index === -1) return
                draft.preGroupByCalculatedColumns?.splice(index, 1)
              })
            }}
          />
        ))}
        <Button
          size="sm"
          onClick={() => {
            onChange((draft) => {
              if (!draft.preGroupByCalculatedColumns) {
                draft.preGroupByCalculatedColumns = []
              }
              draft.preGroupByCalculatedColumns!.push({
                id: v4(),
                name: '',
                expression: '',
                aggregationOperation: AggregationOp.Sum,
                isPercentage: false,
              })
            })
          }}
        >
          Add
        </Button>
      </section>
      <section className="space-y-5 p-4">
        <h3 className="text-md font-medium">Calculated columns</h3>
        {value.calculatedColumns?.map((column, index) => (
          <FormulaEditor
            key={column.id}
            column={column}
            onSave={(column) => {
              onChange((draft) => {
                const index = draft.calculatedColumns?.findIndex(
                  (c) => c.id === column.id
                )
                if (index === undefined || index === -1) return
                draft.calculatedColumns![index] = column
              })
            }}
            onDelete={(column) => {
              onChange((draft) => {
                const index = draft.calculatedColumns?.findIndex(
                  (c) => c.id === column.id
                )
                if (index === undefined || index === -1) return
                draft.calculatedColumns?.splice(index, 1)
              })
            }}
          />
        ))}
        <Button
          size="sm"
          onClick={() => {
            onChange((draft) => {
              if (!draft) return
              if (!draft.calculatedColumns) {
                draft.calculatedColumns = []
              }
              draft.calculatedColumns!.push({
                id: v4(),
                name: '',
                expression: '',
                aggregationOperation: AggregationOp.Sum,
                isPercentage: false,
              })
            })
          }}
        >
          Add
        </Button>
      </section>
      <section className="space-y-5 p-4">
        <h3 className="text-md font-medium">Excluded columns</h3>
        <EditorTextInput
          label="Variable names (comma separated)"
          className="text-xs h-6"
          value={excludeColumnsStr}
          onChange={(e) => setExcludeColumnsStr(e.target.value)}
          onBlur={() => {
            onChange((draft) => {
              if (!draft) return
              draft.excludeColumns = excludeColumnsStr
                .split(',')
                .map((v) => v.trim())
                .filter(Boolean)
            })
          }}
        />
      </section>
      {allowGroupByArea && (
        <section className="space-y-5 p-4">
          <h3 className="text-md font-medium">Grouping by area</h3>
          <EditorSelect
            label="Group by area"
            value={value.groupByArea}
            options={Object.values(AnalyticalAreaType)
              .map((value) => ({
                value: value as any,
                label: toSpaceCase(value),
              }))
              .concat([
                {
                  value: undefined,
                  label: 'None',
                },
              ])}
            onChange={(value) =>
              onChange((draft) => {
                draft.groupByArea = value as AnalyticalAreaType
              })
            }
          />
        </section>
      )}
      {allowGroupByColumn && (
        <section className="space-y-5 p-4">
          <h3 className="text-md font-medium">Grouping by column</h3>
          {value.groupByColumns?.map((column, index) => (
            <GroupByEditor
              key={column.id}
              column={column}
              onSave={(column) => {
                onChange((draft) => {
                  const index = draft.groupByColumns?.findIndex(
                    (c) => c.id === column.id
                  )
                  if (index === undefined || index === -1) return
                  draft.groupByColumns![index] = column
                })
              }}
              onDelete={(column) => {
                onChange((draft) => {
                  const index = draft.groupByColumns?.findIndex(
                    (c) => c.id === column.id
                  )
                  if (index === undefined || index === -1) return
                  draft.groupByColumns?.splice(index, 1)
                })
              }}
            />
          ))}
          {!value.groupByColumns?.length && (
            <Button
              size="sm"
              onClick={() => {
                onChange((draft) => {
                  if (!draft.groupByColumns) {
                    draft.groupByColumns = []
                  }
                  draft.groupByColumns!.push({
                    id: v4(),
                    column: '',
                    aggregationOperation: AggregationOp.Count,
                    isPercentage: false,
                  })
                })
              }}
            >
              Add
            </Button>
          )}
        </section>
      )}
      <section className="space-y-5 p-4">
        <h3 className="text-md font-medium">Variables for formulas</h3>
        <h4 className="font-medium text-sm">Direct from the data source:</h4>
        <pre className="flex flex-row flex-wrap gap-1">
          {statisticalVariables.dataSourceFields?.map((field) => (
            <div
              key={field}
              className="bg-meepGray-700 hover:bg-meepGray-500 px-2 py-1 rounded-md text-xs cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(`\`${field}\``)
                toast.success(`Copied '${field}' to clipboard`)
              }}
            >
              <span>{field}</span>
            </div>
          ))}
        </pre>
        <h4 className="font-medium text-sm">Calculated based on the data:</h4>
        <pre className="flex flex-row flex-wrap gap-1">
          {statisticalVariables.calculatedValues.map((field) => (
            <div
              key={field}
              className="bg-meepGray-700 hover:bg-meepGray-500 px-2 py-1 rounded-md text-xs cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(`\`${field}\``)
                toast.success(`Copied '${field}' to clipboard`)
              }}
            >
              <span>{field}</span>
            </div>
          ))}
        </pre>
      </section>
    </>
  )
}

function FormulaEditor({
  column,
  onSave,
  onDelete,
}: {
  column: CalculatedColumn
  onSave: (c: CalculatedColumn) => void
  onDelete: (c: CalculatedColumn) => void
}) {
  const viewManager = useView(ViewType.Map)
  const defaultValues = useMemo(() => cloneDeep(column), [column])
  const form = useForm({
    defaultValues,
    values: defaultValues,
  })
  const values = form.watch()
  const unsavedChanges =
    !isEqual(defaultValues, values) || form.formState.isDirty
  if (!viewManager || !viewManager.currentViewOfType) return null
  return (
    <div className="p-2 pt-3 border border-meepGray-700 rounded-md relative space-y-2">
      <div className="uppercase text-xs text-meepGray-400 -top-2 px-1 absolute bg-meepGray-600 inline-block">
        Calculated column
      </div>
      <EditorTextInput
        label="Variable name"
        className="text-xs h-6"
        value={values.name}
        onChange={(e) => form.setValue('name', e.target.value)}
      />
      {/* Expression */}
      <EditorTextInput
        label="Formula"
        className="text-xs h-6"
        value={values.expression}
        onChange={(e) => form.setValue('expression', e.target.value)}
      />
      {/* Aggregation operation */}
      <EditorSelect
        label="Aggregation op"
        // labelClassName="w-1/2 shrink-0"
        options={Object.values(AggregationOp).map((value) => ({
          value: value,
          label: toSpaceCase(value),
        }))}
        value={values.aggregationOperation}
        onChange={(str) => {
          form.setValue('aggregationOperation', str as AggregationOp)
        }}
      />
      <EditorSwitch
        label="Is percentage"
        value={!!values.isPercentage}
        onChange={(value) => {
          form.setValue('isPercentage', !!value)
        }}
      />
      <EditorSwitch
        label="Enabled"
        value={!values.ignore}
        onChange={(value) => {
          form.setValue('ignore', !value)
        }}
      />
      {/* DELETE */}
      <div className="flex flex-row justify-between gap-2">
        <Button
          onClick={() => {
            onSave(form.getValues())
            form.reset()
          }}
          variant={'ghost'}
          className={twMerge(
            'p-0 font-semibold',
            unsavedChanges ? 'text-green-500' : 'text-meepGray-400'
          )}
          size={'sm'}
        >
          Save {unsavedChanges ? 'changes' : ''}
        </Button>
        {/* Reset */}
        {!!unsavedChanges && (
          <Button
            onClick={() => form.reset()}
            variant={'ghost'}
            className="text-meepGray-400 p-0"
            size={'sm'}
          >
            Reset
          </Button>
        )}
        <Button
          onClick={() => onDelete(column)}
          variant={'ghost'}
          className="text-red-700 p-0"
          size={'sm'}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}

function GroupByEditor({
  column,
  onSave,
  onDelete,
}: {
  column: GroupByColumn
  onSave: (c: GroupByColumn) => void
  onDelete: (c: GroupByColumn) => void
}) {
  const viewManager = useView(ViewType.Map)
  const defaultValues = useMemo(
    () =>
      cloneDeep({
        ...column,
        name: 'group',
      }),
    [column]
  )
  const form = useForm({
    defaultValues,
    values: defaultValues,
  })
  const values = form.watch()
  const unsavedChanges =
    !isEqual(defaultValues, values) || form.formState.isDirty
  if (!viewManager || !viewManager.currentViewOfType) return null
  return (
    <div className="p-2 pt-3 border border-meepGray-700 rounded-md relative space-y-2">
      <div className="uppercase text-xs text-meepGray-400 -top-2 px-1 absolute bg-meepGray-600 inline-block">
        Group by column
      </div>
      {/* Expression */}
      <EditorTextInput
        label="Group by column"
        className="text-xs h-6"
        value={values.column}
        onChange={(e) => form.setValue('column', e.target.value)}
      />
      {/* Aggregation operation */}
      <EditorSelect
        label="Aggregation op"
        // labelClassName="w-1/2 shrink-0"
        options={Object.values(AggregationOp).map((value) => ({
          value: value,
          label: toSpaceCase(value),
        }))}
        value={values.aggregationOperation}
        onChange={(str) => {
          form.setValue('aggregationOperation', str as AggregationOp)
        }}
      />
      <EditorSwitch
        label="Is percentage"
        value={!!values.isPercentage}
        onChange={(value) => {
          form.setValue('isPercentage', !!value)
        }}
      />
      {/* Ignore */}
      <EditorSwitch
        label="Enabled"
        value={!values.ignore}
        onChange={(value) => {
          form.setValue('ignore', !value)
        }}
      />
      {/* DELETE */}
      <div className="flex flex-row justify-between gap-2">
        <Button
          onClick={() => {
            onSave(form.getValues())
            form.reset()
          }}
          variant={'ghost'}
          className={twMerge(
            'p-0 font-semibold',
            unsavedChanges ? 'text-green-500' : 'text-meepGray-400'
          )}
          size={'sm'}
        >
          Save {unsavedChanges ? 'changes' : ''}
        </Button>
        {/* Reset */}
        {!!unsavedChanges && (
          <Button
            onClick={() => form.reset()}
            variant={'ghost'}
            className="text-meepGray-400 p-0"
            size={'sm'}
          >
            Reset
          </Button>
        )}
        <Button
          onClick={() => onDelete(column)}
          variant={'ghost'}
          className="text-red-700 p-0"
          size={'sm'}
        >
          Remove
        </Button>
      </div>
    </div>
  )
}
