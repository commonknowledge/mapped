import React from 'react';
import { ComponentConfig } from "@measured/puck";
import dynamic from "next/dynamic";
import Mark from 'react-markdown';
import { useAtom } from 'jotai';
import { selectedHubSourceMarkerAtom } from '@/components/hub/data';

export type MarkdownProps = {
    markdown: string
};

export const PopupMarkdown: ComponentConfig<MarkdownProps> = {
    label: "PopupMarkdown",
    fields: {
        markdown: {
            type: "textarea",
        }
    },
    defaultProps: {
        markdown: ''
    },
    render: ({ markdown }) => {
      const [selectedSourceMarker, setSelectedSourceMarker] = useAtom(
        selectedHubSourceMarkerAtom
      );
        // markdown = markdown.replace("{title}", selectedSourceMarker?.properties?.title)
        // todo: replace all {x} with property accessor selectedSourceMarker?.properties[x]
        for (const key in selectedSourceMarker?.properties) {
          if (selectedSourceMarker?.properties.hasOwnProperty(key)) {
            const value = selectedSourceMarker?.properties[key];
            markdown = markdown.replace(`{${key}}`, value)
          }
        }

        return (
          <div className={`text-meepGray-500 prose space-y-2`}>
            <Mark>{markdown}</Mark>
          </div>
        );
    },
};
