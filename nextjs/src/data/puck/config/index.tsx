import { Config } from "@measured/puck";
import { PuckRichText } from "@tohuhono/puck-rich-text"
import Root, { RootProps } from "./root";
import { ButtonGroup, ButtonGroupProps } from "./blocks/ButtonGroup";
import { Card, CardProps } from "./blocks/Card";
import { Columns, ColumnsProps } from "./blocks/Columns";
import { Hero, HeroProps } from "./blocks/Hero";
import { Heading, HeadingProps } from "./blocks/Heading";
import { Flex, FlexProps } from "./blocks/Flex";
import { Logos, LogosProps } from "./blocks/Logos";
import { Stats, StatsProps } from "./blocks/Stats";
import { Text, TextProps } from "./blocks/Text";
import { EventCard, EventCardProps } from "./blocks/EventCard";
import { VerticalSpace, VerticalSpaceProps } from "./blocks/VerticalSpace";
import { GridRow, GridRowProps } from "./blocks/GridRow";
import { SignPost, SignPostProps } from "./blocks/SignPost";
import { SectionHeader, SectionHeaderProps } from "./blocks/SectionHeader/SectionHeader";
import { FilterableGrid, FilterableGridProps } from "./blocks/FilterableGrid";
import { EventList, EventListProps } from "./blocks/EventList";
import { Image, ImageProps } from "./blocks/Image";
import { HomepageItemsAlias } from "./blocks/HomepageItemsAlias";
import { About } from "./blocks/About";
import { HTMLEmbed, HTMLEmbedProps } from "./blocks/HTMLEmbed";
import { Iframe, IframeProps } from "./blocks/Iframe";

export type Props = {
  EventList: EventListProps;
  ButtonGroup: ButtonGroupProps;
  Card: CardProps;
  Columns: ColumnsProps;
  Hero: HeroProps;
  Heading: HeadingProps;
  Flex: FlexProps;
  Logos: LogosProps;
  Stats: StatsProps;
  Text: TextProps;
  Image: ImageProps;
  VerticalSpace: VerticalSpaceProps;
  EventCard: EventCardProps;
  GridRow: GridRowProps;
  FilterableGrid: FilterableGridProps;
  SignPost: SignPostProps;
  SectionHeader: SectionHeaderProps;
  HomepageItemsAlias: any;
  About: any;
  HTMLEmbed: HTMLEmbedProps;
  Iframe: IframeProps
};

export type UserConfig = Config
// <
//   Props,
//   RootProps,
//   "layout" | "typography" | "interactive"
// >;

// We avoid the name config as next gets confused
export const conf: UserConfig = {
  root: {
    render: (props) => <Root {...props} />,
    fields: {
      title: {
        type: "text",
      },
      slug: {
        type: "text",
      },
      seoDescription: {
        type: "text",
      }
    },
  },
  categories: {
    specialLayout: {
      components: [
        "Hero",
        "FilterableGrid",
        "HomepageItemsAlias",
        "About"
      ],
    },
    pageLayout: {
      components: [
        "SectionHeader",
      ]
    },
    grid: {
      components: [
        "Card",
        "GridRow",
      ],
    },
    layout: {
      components: [
        "Columns",
        "Flex",
        "VerticalSpace"
      ],
    },
    content: {
      components: [
        "Text",
        "RichText",
        "HTMLEmbed",
        "Iframe",
        // "Image",
        // "EventList"
      ],
    }
  },
  components: {
    Card,
    Columns,
    Hero,
    Flex,
    PlainText: Text,
    VerticalSpace,
    GridRow,
    FilterableGrid,
    SectionHeader,
    EventList,
    Image,
    HomepageItemsAlias,
    RichText: PuckRichText,
    About,
    HTMLEmbed,
    Iframe
  },
};