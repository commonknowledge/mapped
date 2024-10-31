import React from 'react';
import { ComponentConfig } from "@measured/puck";
import './customRichTextStyles.css';
import dynamic from "next/dynamic";

export type RichTextProps = {
    width: string
    content: string
};

const modules = {
    toolbar: [
        [{ 'size': ['small', 'medium', 'large', 'huge' ] }], 
        [ 'bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link'],
        ['clean']
    ],
};

const formats = [
    'size', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'link'
];

export const RichText: ComponentConfig<RichTextProps> = {
    label: "RichText",
    fields: {
        width: {
            type: "radio",
            options: [
                { label: "Standard", value: "standard" },
                { label: "Full", value: "full" },
            ],
        },
        content: {
            type: "custom",
            render: ({ onChange, value }) => {
                const ReactQuill = dynamic(import('./ReactQuill'), { ssr: false });
                return <ReactQuill
                    value={value}
                    onChange={(e: string) => onChange(e)}
                    modules={modules}
                    formats={formats}
                />
            },
        }
    },
    defaultProps: {
        width: 'standard',
        content: ''
    },
    render: ({ width, content }) => {
        return (
            <div className={`custom-puck-rich-text ${width === "standard" ? 'max-w-[50ch]' : ''} mb-4 text-meepGray-500`}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    },
};
