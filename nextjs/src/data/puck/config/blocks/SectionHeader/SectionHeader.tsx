/* eslint-disable @next/next/no-img-element */
import React from "react";
import { ComponentConfig } from "@measured/puck";
import HubResponsivity from "../../template/HubReponsivity";
import slugify from 'slug'
import { PuckText } from "../../components/PuckText"

export type SectionHeaderProps = {
    title: string;
    slug: string;
    description: string;
};

export const SectionHeader: ComponentConfig<SectionHeaderProps> = {
    fields: {
        title: {
            type: "text",
        },
        slug: {
            type: "text"
        },
        description: {
            type: "textarea",
        },
    },
    resolveData: async ({ props }) => {
      return {
        props: {
          ...props,
          slug: slugify(props.title),
        }
      };
    },
    defaultProps: {
        title: "Heading",
        slug: "",
        description: "Dignissimos et eos fugiat. Facere aliquam corrupti est voluptatem veritatis amet id. Nam repudiandae accusamus illum voluptatibus similique consequuntur. Impedit ut rerum quae. Dolore qui mollitia occaecati soluta numquam. Non corrupti mollitia libero aut atque quibusdam tenetur."
    },
    render: ({ title, description, slug }) => {
        return (
            <HubResponsivity>

                <div className="col-span-2 aspect-[2/1] rounded-[20px]  p-5 border border-jungle-green-200 flex flex-col gap-2 justify-end transition-all">
                    <h2 className="lg:text-hub4xl text-hub3xl" id={slug || slugify(title)}>{title}</h2>
                    <div className="text-xl">
                      <PuckText text={description} />
                    </div>
                </div>
            </HubResponsivity>
        );
    },
};
