'use client'

import { DropZone } from '@measured/puck'
import React from 'react'
import {
  Layout,
  Props,
  GridLayout as RGL,
  WidthProvider,
} from 'react-grid-layout-next'

const GridLayout = WidthProvider(RGL)

type State = {
  layout?: Layout
}

export class BasicLayout extends React.PureComponent<
  Partial<Props> & { measureBeforeMount?: boolean; items: number },
  State
> {
  render() {
    const layout = [
      { i: 'a', x: 0, y: 0, w: 1, h: 1 },
      { i: 'b', x: 2, y: 0, w: 1, h: 2 },
      { i: 'c', x: 4, y: 0, w: 1, h: 1 },
      { i: 'd', x: 1, y: 1, w: 1, h: 1 },
      { i: 'e', x: 4, y: 1, w: 1, h: 1 },
      { i: 'f', x: 4, y: 2, w: 1, h: 1 },
      { i: 'g', x: 0, y: 2, w: 1, h: 1 },

      { i: 'h', x: 2, y: 3, w: 1, h: 2 },
      { i: 'i', x: 3, y: 3, w: 1, h: 1 },
      { i: 'j', x: 1, y: 4, w: 1, h: 1 },
      { i: 'k', x: 3, y: 5, w: 1, h: 1 },
      { i: 'l', x: 1, y: 5, w: 1, h: 1 },
    ]
    return (
      <div className="py-20">
        <GridLayout
          className="layout"
          layout={layout}
          cols={4}
          rowHeight={344}
          width={1200}
          isDraggable={false}
          isResizable={false}
        >
          {layout.map((item) => (
            <div key={item.i}>
              <DropZone zone={item.i} />
            </div>
          ))}
        </GridLayout>
      </div>
    )
  }
}
