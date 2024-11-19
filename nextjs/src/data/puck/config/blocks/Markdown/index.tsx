import React from 'react';
import { ComponentConfig } from "@measured/puck";
import dynamic from "next/dynamic";
import Mark from 'react-markdown';

export type MarkdownProps = {
    markdown: string
};

export const Markdown: ComponentConfig<MarkdownProps> = {
    label: "Markdown",
    fields: {
        markdown: {
            type: "textarea",
        }
    },
    defaultProps: {
        markdown: ''
    },
    render: ({ markdown }) => {
        return (
          <Mark className={`text-meepGray-500 prose`}>{markdown}</Mark>
        );
    },
};
